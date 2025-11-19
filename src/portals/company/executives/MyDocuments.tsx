import React, { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Card,
  Text,
  Badge,
  Button,
  Group,
  Modal,
  Input,
  TextInput,
  Progress,
  Alert,
  Loader,
  Center,
  Divider,
} from '@mantine/core';
import {
  IconFileText,
  IconCheck,
  IconClock,
  IconLock,
  IconEye,
  IconDownload,
  IconPencil,
} from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@mantine/notifications';
import { useExecAuth } from '@/hooks/useExecAuth';
import dayjs from 'dayjs';

interface ExecutiveDocument {
  id: string;
  type: string;
  officer_name: string;
  role: string;
  status: string;
  signature_status: 'pending' | 'signed' | 'expired' | 'declined';
  file_url: string;
  signed_file_url?: string;
  created_at: string;
  signature_token?: string;
  signature_token_expires_at?: string;
  signing_stage?: number;
  signing_order?: number;
  depends_on_document_id?: string;
  appointment_id?: string;
  can_sign?: boolean;
  blocking_documents?: ExecutiveDocument[];
}

interface AppointmentDocument {
  id: string;
  appointment_id: string;
  document_type: string;
  document_url: string;
  created_at: string;
}

const MyDocuments: React.FC = () => {
  const { execUser, loading: authLoading } = useExecAuth();
  const [documents, setDocuments] = useState<ExecutiveDocument[]>([]);
  const [appointmentDocs, setAppointmentDocs] = useState<AppointmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<ExecutiveDocument | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [documentHtmlContent, setDocumentHtmlContent] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && execUser) {
      fetchDocuments();
    }
  }, [authLoading, execUser]);

  const fetchDocuments = async () => {
    if (!execUser) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get exec_users.id for current user
      const { data: currentExec, error: execError } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (execError || !currentExec) {
        console.error('Unable to verify executive status:', execError);
        setLoading(false);
        return;
      }

      // Fetch documents from executive_documents table
      const { data: execDocs, error: execDocsError } = await supabase
        .from('executive_documents')
        .select('*')
        .eq('executive_id', currentExec.id)
        .order('created_at', { ascending: false });

      if (execDocsError) {
        console.error('Error fetching executive documents:', execDocsError);
      }

      // Fetch appointment documents for this executive
      // Try exact email match first
      let { data: appointments, error: appointmentsError } = await supabase
        .from('executive_appointments')
        .select('id, proposed_officer_email, proposed_officer_name, formation_mode, status')
        .eq('proposed_officer_email', user.email)
        .in('status', ['APPROVED', 'SENT_TO_BOARD', 'ACTIVE', 'DRAFT']);

      // If no exact match, try case-insensitive match
      if ((!appointments || appointments.length === 0) && user.email) {
        const { data: appointmentsCaseInsensitive, error: errorCaseInsensitive } = await supabase
          .from('executive_appointments')
          .select('id, proposed_officer_email, proposed_officer_name, formation_mode, status')
          .ilike('proposed_officer_email', user.email)
          .in('status', ['APPROVED', 'SENT_TO_BOARD', 'ACTIVE', 'DRAFT']);
        
        if (appointmentsCaseInsensitive && appointmentsCaseInsensitive.length > 0) {
          appointments = appointmentsCaseInsensitive;
          appointmentsError = errorCaseInsensitive;
        }
      }

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      } else {
        console.log('Found appointments:', appointments?.length || 0, 'for email:', user.email);
        if (appointments && appointments.length > 0) {
          console.log('Appointment details:', appointments);
        }
      }

      // Build document list from appointments
      const appointmentDocuments: ExecutiveDocument[] = [];
      if (appointments && appointments.length > 0) {
        // Fetch all appointment data in parallel
        const appointmentDataPromises = appointments.map(appointment =>
          supabase
            .from('executive_appointments')
            .select('*')
            .eq('id', appointment.id)
            .single()
        );

        const appointmentDataResults = await Promise.all(appointmentDataPromises);

        appointments.forEach((appointment, index) => {
          const appointmentData = appointmentDataResults[index]?.data;
          if (!appointmentData) return;

          // Pre-Incorporation Consent
          if (appointment.formation_mode && appointmentData.pre_incorporation_consent_url) {
            appointmentDocuments.push({
              id: `appointment-${appointment.id}-pre-incorporation-consent`,
              type: 'pre_incorporation_consent',
              officer_name: appointment.proposed_officer_name || '',
              role: 'Officer',
              status: 'generated',
              signature_status: 'pending',
              file_url: appointmentData.pre_incorporation_consent_url,
              created_at: appointmentData.created_at || new Date().toISOString(),
              appointment_id: appointment.id,
              can_sign: true,
            });
          }

          // Other appointment documents
          const docFields = [
            { field: 'appointment_letter_url', type: 'appointment_letter' },
            { field: 'board_resolution_url', type: 'board_resolution' },
            { field: 'certificate_url', type: 'certificate' },
            { field: 'employment_agreement_url', type: 'employment_agreement' },
            { field: 'confidentiality_ip_url', type: 'confidentiality_ip' },
            { field: 'stock_subscription_url', type: 'stock_subscription' },
            { field: 'deferred_compensation_url', type: 'deferred_compensation' },
          ];

          docFields.forEach(({ field, type }) => {
            const url = (appointmentData as any)[field];
            if (url) {
              appointmentDocuments.push({
                id: `appointment-${appointment.id}-${type}`,
                type,
                officer_name: appointment.proposed_officer_name || '',
                role: 'Officer',
                status: 'generated',
                signature_status: 'pending',
                file_url: url,
                created_at: appointmentData.created_at || new Date().toISOString(),
                appointment_id: appointment.id,
                can_sign: true,
              });
            }
          });
        });
      }

      // Filter out appointment documents that already exist in executive_documents
      const existingAppointmentDocIds = new Set(
        (execDocs || [])
          .filter((d: any) => d.appointment_id && d.type)
          .map((d: any) => `${d.appointment_id}-${d.type}`)
      );

      const newAppointmentDocs = appointmentDocuments.filter(
        (doc) => !existingAppointmentDocIds.has(`${doc.appointment_id}-${doc.type}`)
      );

      // Combine and sort documents
      const allDocs = [
        ...(execDocs || []).map((d: any) => ({
          ...d,
          signature_status: d.signature_status || 'pending',
          can_sign: !d.depends_on_document_id || 
            execDocs?.find((dep: any) => dep.id === d.depends_on_document_id && dep.signature_status === 'signed'),
        })),
        ...newAppointmentDocs,
      ].sort((a, b) => {
        if (a.signing_stage !== b.signing_stage) {
          return (a.signing_stage || 999) - (b.signing_stage || 999);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setDocuments(allDocs);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to load documents',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeName = (type: string) => {
    const names: Record<string, string> = {
      pre_incorporation_consent: 'Pre-Incorporation Consent',
      appointment_letter: 'Appointment Letter',
      board_resolution: 'Board Resolution',
      certificate: 'Stock Certificate',
      employment_agreement: 'Employment Agreement',
      confidentiality_ip: 'Confidentiality & IP Assignment',
      stock_subscription: 'Stock Subscription',
      deferred_compensation: 'Deferred Compensation',
    };
    return names[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getStatusBadge = (doc: ExecutiveDocument) => {
    if (doc.signature_status === 'signed') {
      return <Badge color="green" leftSection={<IconCheck size={12} />}>Signed</Badge>;
    }
    if (doc.signature_status === 'expired') {
      return <Badge color="red">Expired</Badge>;
    }
    if (doc.signature_status === 'pending') {
      return <Badge color="orange" leftSection={<IconClock size={12} />}>Signature Required</Badge>;
    }
    return <Badge>{doc.status}</Badge>;
  };

  const isHtmlFile = (url: string): boolean => {
    return url.toLowerCase().endsWith('.html') || url.toLowerCase().includes('.html?');
  };

  const fetchHtmlContent = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error fetching HTML content:', error);
      return null;
    }
  };

  const handleViewDocument = async (doc: ExecutiveDocument) => {
    setSelectedDocument(doc);
    setViewModalVisible(true);
    setDocumentHtmlContent(null);
    
    if (doc.file_url && isHtmlFile(doc.file_url)) {
      setDocumentLoading(true);
      const htmlContent = await fetchHtmlContent(doc.file_url);
      setDocumentHtmlContent(htmlContent);
      setDocumentLoading(false);
    }
  };

  const handleSignDocument = async (doc: ExecutiveDocument) => {
    if (doc.signature_status === 'signed') {
      notifications.show({
        title: 'Already Signed',
        message: 'This document has already been signed',
        color: 'blue',
      });
      return;
    }
    setSelectedDocument(doc);
    setSignModalVisible(true);
    setDocumentHtmlContent(null);
    
    if (doc.file_url && isHtmlFile(doc.file_url)) {
      setDocumentLoading(true);
      const htmlContent = await fetchHtmlContent(doc.file_url);
      setDocumentHtmlContent(htmlContent);
      setDocumentLoading(false);
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (signModalVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 600;
        canvas.height = 200;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signModalVisible]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ('touches' in e ? e.touches[0].clientX - rect.left : (e as any).clientX - rect.left) * scaleX;
    const y = ('touches' in e ? e.touches[0].clientY - rect.top : (e as any).clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    if ('preventDefault' in e) e.preventDefault();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ('touches' in e ? e.touches[0].clientX - rect.left : (e as any).clientX - rect.left) * scaleX;
    const y = ('touches' in e ? e.touches[0].clientY - rect.top : (e as any).clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    if ('preventDefault' in e) e.preventDefault();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = async () => {
    if (!selectedDocument) {
      notifications.show({
        title: 'Error',
        message: 'No document selected',
        color: 'red',
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      notifications.show({
        title: 'Error',
        message: 'Signature canvas not available',
        color: 'red',
      });
      return;
    }

    // Check if canvas has drawing
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((pixel, index) => index % 4 === 3 && pixel > 0);

    if (!hasDrawing) {
      notifications.show({
        title: 'Signature Required',
        message: 'Please draw your signature before submitting',
        color: 'orange',
      });
      return;
    }

    const signaturePng = canvas.toDataURL('image/png');
    if (!signaturePng || signaturePng === 'data:,') {
      notifications.show({
        title: 'Error',
        message: 'Failed to capture signature',
        color: 'red',
      });
      return;
    }

    setIsSigning(true);
    try {
      // Get signer IP
      let signerIp: string | null = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        signerIp = ipData.ip || null;
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError);
      }

      // If it's an appointment document, ensure it exists in executive_documents
      let documentId = selectedDocument.id;
      if (selectedDocument.appointment_id && selectedDocument.id.startsWith('appointment-')) {
        // This is a synthetic ID from appointment - need to find or create the real document
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: currentExec } = await supabase
          .from('exec_users')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!currentExec) throw new Error('Executive record not found');

        // Check if document already exists
        // @ts-ignore - Type instantiation depth issue
        const { data: existingDoc } = await supabase
          .from('executive_documents')
          .select('id')
          .eq('appointment_id', selectedDocument.appointment_id)
          .eq('type', selectedDocument.type)
          .maybeSingle();

        if (existingDoc) {
          documentId = existingDoc.id;
        } else {
          // Create the document record
          const { data: newDoc, error: createError } = await supabase
            .from('executive_documents')
            .insert({
              type: selectedDocument.type,
              officer_name: selectedDocument.officer_name,
              role: selectedDocument.role,
              executive_id: currentExec.id,
              file_url: selectedDocument.file_url,
              signature_status: 'pending',
              status: 'generated',
              appointment_id: selectedDocument.appointment_id,
            })
            .select('id')
            .single();

          if (createError || !newDoc) {
            throw new Error(createError?.message || 'Failed to create document record');
          }
          documentId = newDoc.id;
        }
      }

      // Submit signature via edge function
      const { data, error } = await supabase.functions.invoke('submit-executive-document-signature', {
        body: {
          document_id: documentId,
          typed_name: typedName.trim() || selectedDocument.officer_name || '',
          signature_png_base64: signaturePng,
          signer_ip: signerIp,
          signer_user_agent: navigator.userAgent,
          signature_token: selectedDocument.signature_token || null,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit signature');
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'Signature submission failed');
      }

      notifications.show({
        title: 'Success',
        message: 'Document signed successfully!',
        color: 'green',
      });

      setSignModalVisible(false);
      setSelectedDocument(null);
      setTypedName('');
      clearCanvas();
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error submitting signature:', err);
      notifications.show({
        title: 'Error',
        message: err?.message || 'Failed to submit signature',
        color: 'red',
      });
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  const pendingDocs = documents.filter(d => d.signature_status === 'pending');
  const signedDocs = documents.filter(d => d.signature_status === 'signed');
  const totalDocs = documents.length;
  const progressPercent = totalDocs > 0 ? Math.round((signedDocs.length / totalDocs) * 100) : 0;

  return (
    <Stack gap="md">
      {/* Progress Card */}
      {totalDocs > 0 && (
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600} size="lg">Document Signing Progress</Text>
              <Text size="sm" c="dimmed">{signedDocs.length} of {totalDocs} signed</Text>
            </Group>
            <Progress value={progressPercent} size="lg" radius="xl" />
            <Text size="xs" c="dimmed">
              {pendingDocs.length} document{pendingDocs.length !== 1 ? 's' : ''} requiring signature
            </Text>
          </Stack>
        </Card>
      )}

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={600} size="lg">Documents Requiring Signature</Text>
            {pendingDocs.map((doc) => (
              <Card key={doc.id} padding="md" radius="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start" gap="md">
                    <IconFileText size={24} color={doc.can_sign ? 'orange' : 'gray'} />
                    <Stack gap="xs">
                      <Group gap="xs">
                        <Text fw={600}>{getDocumentTypeName(doc.type)}</Text>
                        {getStatusBadge(doc)}
                        {doc.signing_stage && (
                          <Badge variant="light" color="blue">Stage {doc.signing_stage}</Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed">
                        Created: {dayjs(doc.created_at).format('MMMM D, YYYY')}
                      </Text>
                      {!doc.can_sign && doc.blocking_documents && doc.blocking_documents.length > 0 && (
                        <Alert color="yellow" icon={<IconLock size={16} />}>
                          Previous document must be signed first
                        </Alert>
                      )}
                    </Stack>
                  </Group>
                  <Group>
                    <Button
                      variant="light"
                      leftSection={<IconEye size={16} />}
                      onClick={() => handleViewDocument(doc)}
                    >
                      View
                    </Button>
                    <Button
                      leftSection={<IconPencil size={16} />}
                      disabled={!doc.can_sign}
                      onClick={() => handleSignDocument(doc)}
                    >
                      Sign
                    </Button>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Card>
      )}

      {/* Signed Documents */}
      {signedDocs.length > 0 && (
        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={600} size="lg">Signed Documents</Text>
            {signedDocs.map((doc) => (
              <Card key={doc.id} padding="md" radius="md" withBorder>
                <Group justify="space-between">
                  <Group align="flex-start" gap="md">
                    <IconCheck size={24} color="green" />
                    <Stack gap="xs">
                      <Group gap="xs">
                        <Text fw={600}>{getDocumentTypeName(doc.type)}</Text>
                        {getStatusBadge(doc)}
                      </Group>
                      <Text size="sm" c="dimmed">
                        Signed: {dayjs(doc.created_at).format('MMMM D, YYYY')}
                      </Text>
                    </Stack>
                  </Group>
                  <Group>
                    {doc.signed_file_url && (
                      <Button
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        component="a"
                        href={doc.signed_file_url}
                        target="_blank"
                      >
                        Download Signed
                      </Button>
                    )}
                    <Button
                      variant="light"
                      leftSection={<IconEye size={16} />}
                      onClick={() => handleViewDocument(doc)}
                    >
                      View
                    </Button>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Card>
      )}

      {documents.length === 0 && (
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <IconFileText size={48} color="gray" />
              <Text fw={600} size="lg">No Documents Found</Text>
              <Text size="sm" c="dimmed" ta="center">
                You don't have any documents assigned to you at this time.
              </Text>
            </Stack>
          </Center>
        </Card>
      )}

      {/* View Document Modal */}
      <Modal
        opened={viewModalVisible}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedDocument(null);
          setDocumentHtmlContent(null);
        }}
        title={selectedDocument ? `View: ${getDocumentTypeName(selectedDocument.type)}` : 'View Document'}
        size="xl"
      >
        {selectedDocument?.file_url && (
          <>
            {documentLoading ? (
              <Center h={600}>
                <Loader size="lg" />
              </Center>
            ) : isHtmlFile(selectedDocument.file_url) && documentHtmlContent ? (
              <div
                style={{
                  height: '600px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'auto',
                  padding: '1rem',
                  backgroundColor: '#fff',
                }}
                dangerouslySetInnerHTML={{ __html: documentHtmlContent }}
              />
            ) : (
              <iframe
                src={selectedDocument.file_url}
                className="w-full"
                style={{ height: '600px', border: '1px solid #ddd', borderRadius: '4px' }}
                title="Document Viewer"
              />
            )}
          </>
        )}
      </Modal>

      {/* Sign Document Modal */}
      <Modal
        opened={signModalVisible}
        onClose={() => {
          if (!isSigning) {
            setSignModalVisible(false);
            setSelectedDocument(null);
            setTypedName('');
            setDocumentHtmlContent(null);
            clearCanvas();
          }
        }}
        title={selectedDocument ? `Sign: ${getDocumentTypeName(selectedDocument.type)}` : 'Sign Document'}
        size="xl"
      >
        {selectedDocument && (
          <Stack gap="md">
            <Alert color="blue">
              <Text size="sm">
                By signing below, you acknowledge that you have read and agree to the terms of this document.
                This electronic signature is legally binding and equivalent to a handwritten signature.
              </Text>
            </Alert>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Stack gap="md">
                <TextInput
                  label="Type your full legal name"
                  placeholder="Full legal name"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  required
                />
                <div>
                  <Text size="sm" fw={500} mb="xs">Draw your signature</Text>
                  <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '1rem', background: 'white' }}>
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      style={{
                        width: '100%',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'crosshair',
                        touchAction: 'none',
                        background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                        backgroundSize: '20px 20px',
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <Button variant="light" size="xs" mt="xs" onClick={clearCanvas}>
                    Clear Signature
                  </Button>
                </div>
              </Stack>
              <div>
                <Text size="sm" fw={500} mb="xs">Document Preview</Text>
                {selectedDocument.file_url && (
                  <>
                    {documentLoading ? (
                      <Center h={400}>
                        <Loader size="md" />
                      </Center>
                    ) : isHtmlFile(selectedDocument.file_url) && documentHtmlContent ? (
                      <div
                        style={{
                          width: '100%',
                          height: '400px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          overflow: 'auto',
                          padding: '1rem',
                          backgroundColor: '#fff',
                        }}
                        dangerouslySetInnerHTML={{ __html: documentHtmlContent }}
                      />
                    ) : (
                      <iframe
                        src={selectedDocument.file_url}
                        style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '4px' }}
                        title="Document Preview"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={() => {
                  setSignModalVisible(false);
                  setSelectedDocument(null);
                  setTypedName('');
                  clearCanvas();
                }}
                disabled={isSigning}
              >
                Cancel
              </Button>
              <Button
                onClick={submitSignature}
                disabled={isSigning || !typedName.trim()}
                loading={isSigning}
                leftSection={<IconPencil size={16} />}
              >
                {isSigning ? 'Signing...' : 'Sign & Submit'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default MyDocuments;

