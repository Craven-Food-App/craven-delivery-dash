import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Button,
  Table,
  Badge,
  Group,
  Text,
  Stack,
  Title,
  ActionIcon,
  Modal,
  Paper,
  Divider,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/integrations/supabase/client';
import {
  IconPlus,
  IconEye,
  IconFileText,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface ExecutiveAppointment {
  id: string;
  proposed_officer_name: string;
  proposed_officer_email?: string;
  proposed_title: string;
  appointment_type: string;
  board_meeting_date?: string;
  effective_date: string;
  term_length_months?: number;
  authority_granted?: string;
  compensation_structure?: string;
  equity_included: boolean;
  equity_details?: string;
  notes?: string;
  status: string;
  board_resolution_id?: string;
  appointment_letter_url?: string;
  board_resolution_url?: string;
  certificate_url?: string;
  employment_agreement_url?: string;
  deferred_compensation_url?: string;
  confidentiality_ip_url?: string;
  stock_subscription_url?: string;
  pre_incorporation_consent_url?: string;
  formation_mode?: boolean;
  created_at: string;
  updated_at: string;
}

const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<ExecutiveAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ExecutiveAppointment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string>('');
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loadingDocument, setLoadingDocument] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('executive_appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load appointments',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      DRAFT: { color: 'gray', label: 'Draft', icon: <IconFileText size={14} /> },
      SENT_TO_BOARD: { color: 'blue', label: 'Sent to Board', icon: <IconClock size={14} /> },
      APPROVED: { color: 'green', label: 'Approved', icon: <IconCheck size={14} /> },
      REJECTED: { color: 'red', label: 'Rejected', icon: <IconX size={14} /> },
    };

    const config = statusConfig[status] || { color: 'gray', label: status, icon: null };
    return (
      <Badge color={config.color} leftSection={config.icon}>
        {config.label}
      </Badge>
    );
  };

  const handleViewDocument = async (url: string, name: string) => {
    if (!url) {
      notifications.show({
        title: 'No Document',
        message: `${name} has not been generated yet`,
        color: 'yellow',
      });
      return;
    }
    setSelectedDocumentUrl(url);
    setSelectedDocumentName(name);
    setDocumentModalOpen(true);
    setLoadingDocument(true);
    setDocumentContent('');
    
    // For HTML files, fetch the content to render properly
    if (url.includes('.html') || url.endsWith('.html')) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          setDocumentContent(html);
        } else {
          console.error('Failed to fetch document:', response.status);
          setDocumentContent('');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setDocumentContent('');
      } finally {
        setLoadingDocument(false);
      }
    } else {
      setLoadingDocument(false);
    }
  };

  const handleRegenerateDocuments = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('governance-backfill-appointment-documents', {
        body: { 
          appointment_id: appointmentId,
          force_regenerate: true, // Force regeneration even if documents exist
        },
      });

      if (error) throw error;

      if (data) {
        const { documents_generated, errors_count, all_errors, results } = data;
        
        if (documents_generated > 0) {
          notifications.show({
            title: 'Success',
            message: `Generated ${documents_generated} document(s). Please refresh to see them.`,
            color: 'green',
          });
        } else if (errors_count > 0) {
          // Show detailed error messages
          const errorMessages = all_errors?.join('\n') || 'Unknown error';
          notifications.show({
            title: 'Document Generation Failed',
            message: `Failed to generate documents:\n${errorMessages}`,
            color: 'red',
            autoClose: 15000,
          });
        } else {
          // Check if there are any results with details
          const resultDetails = results?.map((r: any) => {
            if (r.errors && r.errors.length > 0) {
              return `${r.appointment_name}: ${r.errors.join(', ')}`;
            }
            if (r.reason_no_docs) {
              return `${r.appointment_name}: ${r.reason_no_docs}`;
            }
            if (r.documents_queued && r.documents_queued.length > 0) {
              return `${r.appointment_name}: Queued ${r.documents_queued.join(', ')} but none were generated`;
            }
            return null;
          }).filter(Boolean).join('\n');
          
          const message = resultDetails 
            ? `No documents were generated.\n${resultDetails}`
            : 'No documents were generated. This may be because all documents already exist or templates are missing.';
          
          notifications.show({
            title: 'No Documents Generated',
            message,
            color: 'yellow',
            autoClose: 15000,
          });
        }
      }

      // Refresh immediately and again after a delay to ensure we get the latest data
      fetchAppointments();
      setTimeout(() => {
        fetchAppointments();
      }, 3000);
    } catch (error: any) {
      console.error('Error regenerating documents:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to regenerate documents',
        color: 'red',
      });
    }
  };

  const getDocumentStatus = (appointment: ExecutiveAppointment) => {
    const docs: Record<string, string | undefined> = {
      'Appointment Letter': appointment.appointment_letter_url,
      'Board Resolution': appointment.board_resolution_url,
      'Certificate': appointment.certificate_url,
      'Employment Agreement': appointment.employment_agreement_url,
      'Confidentiality & IP': appointment.confidentiality_ip_url,
      'Stock Subscription': appointment.stock_subscription_url,
      'Deferred Compensation': appointment.deferred_compensation_url,
    };
    
    // Always include formation document in the list if formation_mode is true
    // This ensures the count shows 8/8 even if the document hasn't been generated yet
    if (appointment.formation_mode) {
      docs['Pre-Incorporation Consent'] = appointment.pre_incorporation_consent_url;
    }
    
    return docs;
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} c="dark" mb="xs">
              Executive Appointments
            </Title>
            <Text c="dimmed" size="lg">
              Manage executive appointments and view generated documents
            </Text>
          </div>
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={fetchAppointments}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate('/company/governance-admin/appointments/new')}
            >
              New Appointment
            </Button>
          </Group>
        </Group>

        {appointments.length === 0 ? (
          <Card>
            <Alert icon={<IconAlertCircle size={16} />} title="No Appointments" color="blue">
              No executive appointments found. Create a new appointment to get started.
            </Alert>
          </Card>
        ) : (
          <Card>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Officer</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Effective Date</Table.Th>
                  <Table.Th>Documents</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {appointments.map((appointment) => {
                  const docs = getDocumentStatus(appointment);
                  const hasAnyDoc = Object.values(docs).some((url) => url);
                  const docCount = Object.values(docs).filter((url) => url).length;
                  
                  // Total document count: 7 normal + 1 formation (if formation_mode is true)
                  const totalDocCount = appointment.formation_mode ? 8 : 7;

                  return (
                    <Table.Tr key={appointment.id}>
                      <Table.Td>
                        <div>
                          <Text fw={500}>{appointment.proposed_officer_name}</Text>
                          {appointment.proposed_officer_email && (
                            <Text size="xs" c="dimmed">
                              {appointment.proposed_officer_email}
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>{appointment.proposed_title}</Table.Td>
                      <Table.Td>{getStatusBadge(appointment.status)}</Table.Td>
                      <Table.Td>
                        {dayjs(appointment.effective_date).format('MMM D, YYYY')}
                      </Table.Td>
                      <Table.Td>
                        {hasAnyDoc ? (
                          <Badge color="green" variant="light">
                            {docCount} / {totalDocCount} Generated
                          </Badge>
                        ) : (
                          <Badge color="yellow" variant="light">
                            No Documents
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setViewModalOpen(true);
                            }}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="orange"
                            onClick={() => handleRegenerateDocuments(appointment.id)}
                            title="Regenerate Documents"
                          >
                            <IconRefresh size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Card>
        )}
      </Stack>

      {/* View Appointment Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAppointment(null);
        }}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Officer Name
              </Text>
              <Text fw={500}>{selectedAppointment.proposed_officer_name}</Text>
            </div>

            {selectedAppointment.proposed_officer_email && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Email
                </Text>
                <Text>{selectedAppointment.proposed_officer_email}</Text>
              </div>
            )}

            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Title
              </Text>
              <Text fw={500}>{selectedAppointment.proposed_title}</Text>
            </div>

            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Status
              </Text>
              {getStatusBadge(selectedAppointment.status)}
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Effective Date
              </Text>
              <Text>{dayjs(selectedAppointment.effective_date).format('MMMM D, YYYY')}</Text>
            </div>

            {selectedAppointment.board_meeting_date && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Board Meeting Date
                </Text>
                <Text>{dayjs(selectedAppointment.board_meeting_date).format('MMMM D, YYYY')}</Text>
              </div>
            )}

            <Divider />

            <div>
              <Text size="sm" c="dimmed" mb="md">
                Generated Documents
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Appointment Letter</Text>
                  {selectedAppointment.appointment_letter_url ? (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() =>
                        handleViewDocument(
                          selectedAppointment.appointment_letter_url!,
                          'Appointment Letter'
                        )
                      }
                    >
                      View
                    </Button>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm">
                      Not Generated
                    </Badge>
                  )}
                </Group>

                <Group justify="space-between">
                  <Text size="sm">Board Resolution</Text>
                  {selectedAppointment.board_resolution_url ? (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() =>
                        handleViewDocument(
                          selectedAppointment.board_resolution_url!,
                          'Board Resolution'
                        )
                      }
                    >
                      View
                    </Button>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm">
                      Not Generated
                    </Badge>
                  )}
                </Group>

                <Group justify="space-between">
                  <Text size="sm">Certificate</Text>
                  {selectedAppointment.certificate_url ? (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() =>
                        handleViewDocument(selectedAppointment.certificate_url!, 'Certificate')
                      }
                    >
                      View
                    </Button>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm">
                      Not Generated
                    </Badge>
                  )}
                </Group>

                <Group justify="space-between">
                  <Text size="sm">Employment Agreement</Text>
                  {selectedAppointment.employment_agreement_url ? (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() =>
                        handleViewDocument(
                          selectedAppointment.employment_agreement_url!,
                          'Employment Agreement'
                        )
                      }
                    >
                      View
                    </Button>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm">
                      Not Generated
                    </Badge>
                  )}
                </Group>

                <Group justify="space-between">
                  <Text size="sm">Confidentiality & IP Assignment</Text>
                  {selectedAppointment.confidentiality_ip_url ? (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() =>
                        handleViewDocument(
                          selectedAppointment.confidentiality_ip_url!,
                          'Confidentiality & IP Assignment'
                        )
                      }
                    >
                      View
                    </Button>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm">
                      Not Generated
                    </Badge>
                  )}
                </Group>

                <Group justify="space-between">
                  <Text size="sm">Stock Subscription</Text>
                  {selectedAppointment.stock_subscription_url ? (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() =>
                        handleViewDocument(
                          selectedAppointment.stock_subscription_url!,
                          'Stock Subscription'
                        )
                      }
                    >
                      View
                    </Button>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm">
                      Not Generated
                    </Badge>
                  )}
                </Group>

                <Group justify="space-between">
                  <Text size="sm">Deferred Compensation</Text>
                  {selectedAppointment.deferred_compensation_url ? (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() =>
                        handleViewDocument(
                          selectedAppointment.deferred_compensation_url!,
                          'Deferred Compensation'
                        )
                      }
                    >
                      View
                    </Button>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm">
                      Not Generated
                    </Badge>
                  )}
                </Group>

                {selectedAppointment.formation_mode && (
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Text size="sm">Pre-Incorporation Consent</Text>
                      <Badge color="blue" variant="light" size="xs">
                        Formation Document
                      </Badge>
                    </Group>
                    {selectedAppointment.pre_incorporation_consent_url ? (
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() =>
                          handleViewDocument(
                            selectedAppointment.pre_incorporation_consent_url!,
                            'Pre-Incorporation Consent'
                          )
                        }
                      >
                        View
                      </Button>
                    ) : (
                      <Badge color="yellow" variant="light" size="sm">
                        Not Generated
                      </Badge>
                    )}
                  </Group>
                )}
              </Stack>
            </div>

            <Divider />

            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => handleRegenerateDocuments(selectedAppointment.id)}
              >
                Regenerate All Documents
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      <Modal
        opened={documentModalOpen}
        onClose={() => {
          setDocumentModalOpen(false);
          setSelectedDocumentUrl('');
          setSelectedDocumentName('');
          setDocumentContent('');
        }}
        title={selectedDocumentName}
        size="xl"
      >
        {selectedDocumentUrl && (
          <Paper p="md">
            {loadingDocument ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>Loading document...</Text>
              </div>
            ) : selectedDocumentUrl.includes('.html') || selectedDocumentUrl.endsWith('.html') ? (
              // For HTML files, render the fetched content in a sandboxed iframe
              documentContent ? (
                <div style={{ width: '100%', height: '600px', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <iframe
                    srcDoc={documentContent}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    title={selectedDocumentName}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              ) : (
                <iframe
                  src={selectedDocumentUrl}
                  style={{
                    width: '100%',
                    height: '600px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                  }}
                  title={selectedDocumentName}
                  sandbox="allow-same-origin allow-scripts"
                />
              )
            ) : selectedDocumentUrl.endsWith('.pdf') || selectedDocumentUrl.includes('.pdf') ? (
              // For PDF files, use embed
              <embed
                src={selectedDocumentUrl}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '600px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                }}
              />
            ) : (
              // For other file types, use iframe
              <iframe
                src={selectedDocumentUrl}
                style={{
                  width: '100%',
                  height: '600px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                }}
                title={selectedDocumentName}
              />
            )}
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={() => {
                  window.open(selectedDocumentUrl, '_blank');
                }}
              >
                Open in New Tab
              </Button>
            </Group>
          </Paper>
        )}
      </Modal>
    </Container>
  );
};

export default AppointmentList;
