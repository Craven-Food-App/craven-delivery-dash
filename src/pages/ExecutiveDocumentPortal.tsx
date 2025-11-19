import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Space, message, Modal, Input, Alert, Progress } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined, DownloadOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useExecAuth } from '@/hooks/useExecAuth';
import { LoadingOutlined } from '@ant-design/icons';

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
  packet_id?: string;
  template_key?: string;
  can_sign?: boolean; // Computed: all dependencies signed
  blocking_documents?: ExecutiveDocument[]; // Documents that must be signed first
}

export const ExecutiveDocumentPortal: React.FC = () => {
  const { execUser, loading: authLoading, isAuthorized } = useExecAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<ExecutiveDocument[]>([]);
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
    if (!authLoading && !isAuthorized) {
      navigate('/hub');
      return;
    }
    if (execUser) {
      fetchDocuments();
    }
  }, [authLoading, isAuthorized, execUser]);

  const fetchDocuments = async () => {
    if (!execUser) return;
    
    setLoading(true);
    try {
      // Get exec_users.id for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentExec, error: execError } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (execError || !currentExec) {
        message.error('Unable to verify executive status');
        return;
      }

      // Fetch documents assigned to this executive
      const { data, error } = await supabase
        .from('executive_documents')
        .select('*')
        .eq('executive_id', currentExec.id);

      if (error) throw error;
      
      // Sort by signing_stage, then signing_order, then created_at
      // IMPORTANT: Show ALL documents - don't deduplicate by template_key/role
      // Multiple documents of the same type may need signatures (e.g., different stages)
      const sorted = (data || []).map(d => ({
        ...d,
        signature_status: d.signature_status as 'pending' | 'signed' | 'expired' | 'declined',
        signing_stage: (d as any).signing_stage as number | undefined,
        signing_order: (d as any).signing_order as number | undefined,
        depends_on_document_id: (d as any).depends_on_document_id as string | undefined,
        packet_id: (d as any).packet_id as string | undefined,
        template_key: (d as any).template_key as string | undefined,
        signature_token: (d as any).signature_token as string | undefined,
      } as ExecutiveDocument)).sort((a, b) => {
        if (a.signing_stage !== b.signing_stage) {
          return (a.signing_stage || 999) - (b.signing_stage || 999);
        }
        if (a.signing_order !== b.signing_order) {
          return (a.signing_order || 999) - (b.signing_order || 999);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Calculate dependencies and signing eligibility for ALL documents
      const withDependencies = sorted.map(doc => {
        const dependsOn = sorted.find(d => d.id === doc.depends_on_document_id);
        const canSign = !dependsOn || dependsOn.signature_status === 'signed';

        return {
          ...doc,
          can_sign: canSign,
          blocking_documents: dependsOn && dependsOn.signature_status !== 'signed' ? [dependsOn] : [],
        };
      });

      setDocuments(withDependencies);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string, signatureStatus?: string) => {
    if (signatureStatus === 'signed') {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Signed</Tag>;
    }
    if (signatureStatus === 'expired') {
      return <Tag color="red">Expired</Tag>;
    }
    if (signatureStatus === 'pending') {
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Signature Required</Tag>;
    }
    return <Tag>{status}</Tag>;
  };

  const getDocumentTypeName = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
      message.info('This document has already been signed');
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

  // Initialize canvas when modal opens
  useEffect(() => {
    if (signModalVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx) {
        canvas.width = 500;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ('touches' in e ? e.touches[0].clientX - rect.left : (e as any).clientX - rect.left) * scaleX;
    const y = ('touches' in e ? e.touches[0].clientY - rect.top : (e as any).clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
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
    const ctx = canvas.getContext('2d', { alpha: true });
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
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const submitSignature = async () => {
    if (!selectedDocument) {
      message.warning('No document selected');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      message.warning('Signature canvas not available');
      return;
    }

    // Get signature as PNG (with transparency)
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      message.warning('Canvas context not available');
      return;
    }

    // Check if canvas has any drawing (not blank)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((pixel, index) => {
      // Check alpha channel (every 4th value)
      return index % 4 === 3 && pixel > 0;
    });

    if (!hasDrawing) {
      message.warning('Please draw your signature before submitting');
      return;
    }

    const signaturePng = canvas.toDataURL('image/png');
    if (!signaturePng || signaturePng === 'data:,') {
      message.warning('Failed to capture signature. Please try again.');
      return;
    }

    setIsSigning(true);
    try {
      // Get signer IP (optional)
      let signerIp: string | null = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        signerIp = ipData.ip || null;
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError);
      }

      // Submit signature via edge function
      // Include signature_token if available (required for token-based signing)
      const { data, error } = await supabase.functions.invoke('submit-executive-document-signature', {
        body: {
          document_id: selectedDocument.id,
          typed_name: typedName.trim() || selectedDocument.officer_name || null,
          signature_png_base64: signaturePng,
          signer_ip: signerIp,
          signer_user_agent: navigator.userAgent,
          signature_token: selectedDocument.signature_token || null,
        },
      });

      // Handle edge function errors - when status is non-2xx, data may contain the error response
      if (error) {
        // When edge function returns non-2xx, data might still contain the error JSON
        let errorMessage = 'Signature submission failed';
        
        if (data?.error) {
          errorMessage = data.error;
        } else if (error.message && error.message !== 'Edge Function returned a non-2xx status code') {
          errorMessage = error.message;
        } else if (typeof error === 'object' && 'error' in error) {
          errorMessage = String(error.error);
        }
        
        console.error('Signature submission error:', { error, data });
        throw new Error(errorMessage);
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'Signature submission failed');
      }

      message.success('Document signed successfully!');
      setSignModalVisible(false);
      setSelectedDocument(null);
      setTypedName('');
      clearCanvas();
      await fetchDocuments(); // Refresh list
    } catch (err: any) {
      console.error('Error submitting signature:', err);
      message.error(err?.message || 'Failed to submit signature. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingOutlined style={{ fontSize: 48 }} spin />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  const pendingDocuments = documents.filter(d => d.signature_status === 'pending');
  const signedDocuments = documents.filter(d => d.signature_status === 'signed');
  const signableDocuments = documents.filter(d => d.signature_status === 'pending' || d.signature_status === 'signed');

  // Group documents by stage for better organization
  const documentsByStage = {
    stage1: documents.filter(d => d.signing_stage === 1),
    stage2: documents.filter(d => d.signing_stage === 2),
    stage3: documents.filter(d => d.signing_stage === 3),
    stage4: documents.filter(d => d.signing_stage === 4),
    ungrouped: documents.filter(d => !d.signing_stage),
  };
  
  // Calculate progress
  const totalDocuments = signableDocuments.length;
  const signedCount = signedDocuments.length;
  const progressPercent = totalDocuments > 0 ? Math.round((signedCount / totalDocuments) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Document Portal</h1>
          <p className="text-gray-600 mb-4">
            Welcome, {execUser?.title || 'Executive'}. Review and sign your executive agreements below.
          </p>
          {totalDocuments > 0 && (
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Signing Progress</span>
                <span className="text-sm text-gray-600">{signedCount} of {totalDocuments} documents signed</span>
              </div>
              <Progress percent={progressPercent} status={progressPercent === 100 ? 'success' : 'active'} />
            </Card>
          )}
        </div>

        {/* Pending Signatures Section */}
        {pendingDocuments.length > 0 && (
          <Card className="mb-6" title={<span className="text-lg font-semibold">Documents Requiring Signature ({pendingDocuments.length})</span>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {pendingDocuments.map((doc) => (
                <Card key={doc.id} size="small" className={`border-l-4 ${doc.can_sign ? 'border-l-orange-500' : 'border-l-gray-300'}`}>
                  {!doc.can_sign && doc.blocking_documents && doc.blocking_documents.length > 0 && (
                    <Alert
                      message="Previous document must be signed first"
                      description={
                        <div>
                          <p className="mb-1">This document requires the following to be signed first:</p>
                          <ul className="list-disc list-inside">
                            {doc.blocking_documents.map(blocking => (
                              <li key={blocking.id}>{getDocumentTypeName(blocking.type)}</li>
                            ))}
                          </ul>
                        </div>
                      }
                      type="warning"
                      showIcon
                      icon={<LockOutlined />}
                      className="mb-3"
                    />
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileTextOutlined className={doc.can_sign ? "text-orange-500 text-xl" : "text-gray-400 text-xl"} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{getDocumentTypeName(doc.type)}</h3>
                            {doc.signing_stage && (
                              <Tag color="blue">Stage {doc.signing_stage}</Tag>
                            )}
                            {doc.packet_id && (
                              <Tag color="cyan" className="text-xs">{doc.packet_id}</Tag>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm">
                            Role: {doc.role} • Created: {new Date(doc.created_at).toLocaleDateString()}
                            {doc.signing_order && ` • Order: ${doc.signing_order}`}
                          </p>
                        </div>
                      </div>
                      {getStatusTag(doc.status, doc.signature_status)}
                      {doc.signature_token_expires_at && new Date(doc.signature_token_expires_at) < new Date() && (
                        <Tag color="red" className="ml-2">Expired</Tag>
                      )}
                    </div>
                    <Space>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDocument(doc)}
                      >
                        View
                      </Button>
                      <Button
                        type="primary"
                        icon={doc.can_sign ? <CheckCircleOutlined /> : <LockOutlined />}
                        disabled={!doc.can_sign}
                        onClick={() => handleSignDocument(doc)}
                      >
                        {doc.can_sign ? 'Sign Document' : 'Waiting for Previous Document'}
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* Signed Documents Section */}
        {signedDocuments.length > 0 && (
          <Card title={<span className="text-lg font-semibold">Signed Documents ({signedDocuments.length})</span>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {signedDocuments.map((doc) => (
                <Card key={doc.id} size="small">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileTextOutlined className="text-green-500 text-xl" />
                        <div>
                          <h3 className="font-semibold text-lg">{getDocumentTypeName(doc.type)}</h3>
                          <p className="text-gray-500 text-sm">
                            Role: {doc.role} • Signed: {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusTag(doc.status, doc.signature_status)}
                    </div>
                    <Space>
                      {doc.signed_file_url && (
                        <Button
                          icon={<DownloadOutlined />}
                          href={doc.signed_file_url}
                          target="_blank"
                        >
                          Download Signed PDF
                        </Button>
                      )}
                      {doc.file_url && (
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDocument(doc)}
                        >
                          View Original
                        </Button>
                      )}
                    </Space>
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {documents.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <FileTextOutlined className="text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Documents Found</h3>
              <p className="text-gray-500">You don't have any documents assigned to you at this time.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Document Viewer Modal */}
      <Modal
        title={`View Document: ${selectedDocument ? getDocumentTypeName(selectedDocument.type) : ''}`}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedDocument(null);
          setDocumentHtmlContent(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalVisible(false);
            setSelectedDocument(null);
          }}>
            Close
          </Button>,
          selectedDocument?.file_url && (
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              href={selectedDocument.file_url}
              target="_blank"
            >
              Download
            </Button>
          ),
        ]}
        width={1000}
      >
        {selectedDocument?.file_url && (
          <div className="mt-4">
            {documentLoading ? (
              <div className="flex items-center justify-center" style={{ height: '600px' }}>
                <LoadingOutlined style={{ fontSize: 48 }} spin />
              </div>
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
          </div>
        )}
      </Modal>

      {/* Signature Modal */}
      <Modal
        title={`Sign Document: ${selectedDocument ? getDocumentTypeName(selectedDocument.type) : ''}`}
        open={signModalVisible}
        onCancel={() => {
          setSignModalVisible(false);
          setSelectedDocument(null);
          setTypedName('');
          setDocumentHtmlContent(null);
          clearCanvas();
        }}
        footer={null}
        width={800}
      >
        {selectedDocument && (
          <div className="mt-4">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Document:</strong> {getDocumentTypeName(selectedDocument.type)}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Role:</strong> {selectedDocument.role}
              </p>
              <p className="text-sm text-gray-600">
                By signing below, you acknowledge that you have read and agree to the terms of this document. 
                This electronic signature is legally binding and equivalent to a handwritten signature.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Type your full legal name *</label>
                <Input
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Full legal name"
                  className="mb-4"
                />
                <label className="block text-sm font-semibold mb-2">Draw your signature *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="border rounded w-full cursor-crosshair"
                    style={{ 
                      touchAction: 'none', 
                      display: 'block',
                      background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
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
                <Button className="mt-2" onClick={clearCanvas}>Clear Signature</Button>
              </div>
              <div>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Document Preview</h4>
                  {selectedDocument.file_url && (
                    <>
                      {documentLoading ? (
                        <div className="flex items-center justify-center" style={{ height: '400px' }}>
                          <LoadingOutlined style={{ fontSize: 32 }} spin />
                        </div>
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
                          className="w-full border rounded"
                          style={{ height: '400px' }}
                          title="Document Preview"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => {
                setSignModalVisible(false);
                setSelectedDocument(null);
                setTypedName('');
                clearCanvas();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                disabled={isSigning}
                loading={isSigning}
                onClick={submitSignature}
              >
                {isSigning ? 'Signing...' : 'Sign & Submit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

