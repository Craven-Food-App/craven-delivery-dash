import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Space, message, Modal, Input } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
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
        .eq('executive_id', currentExec.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []).map(d => ({ ...d, signature_status: d.signature_status as 'pending' | 'signed' | 'expired' | 'declined' })));
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

  const handleViewDocument = (doc: ExecutiveDocument) => {
    setSelectedDocument(doc);
    setViewModalVisible(true);
  };

  const handleSignDocument = (doc: ExecutiveDocument) => {
    if (doc.signature_status === 'signed') {
      message.info('This document has already been signed');
      return;
    }
    setSelectedDocument(doc);
    setSignModalVisible(true);
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as any).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as any).clientY - rect.top;
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
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as any).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as any).clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
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
    if (!selectedDocument || !typedName) {
      message.warning('Please enter your full legal name');
      return;
    }

    setIsSigning(true);
    try {
      const canvas = canvasRef.current;
      const signaturePng = canvas?.toDataURL('image/png') || null;

      // Get signer IP
      const signerIp = (await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .catch(() => ({ ip: null }))).ip;

      // Submit signature via edge function
      const { data, error } = await supabase.functions.invoke('submit-executive-document-signature', {
        body: {
          document_id: selectedDocument.id,
          typed_name: typedName,
          signature_png_base64: signaturePng,
          signer_ip: signerIp,
          signer_user_agent: navigator.userAgent,
        },
      });

      if (error) throw error;

      message.success('Document signed successfully!');
      setSignModalVisible(false);
      setSelectedDocument(null);
      setTypedName('');
      clearCanvas();
      await fetchDocuments(); // Refresh list
    } catch (err: any) {
      console.error('Error submitting signature:', err);
      message.error(err?.message || 'Failed to submit signature');
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Document Portal</h1>
          <p className="text-gray-600">
            Welcome, {execUser?.title || 'Executive'}. Review and sign your executive agreements below.
          </p>
        </div>

        {/* Pending Signatures Section */}
        {pendingDocuments.length > 0 && (
          <Card className="mb-6" title={<span className="text-lg font-semibold">Documents Requiring Signature ({pendingDocuments.length})</span>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {pendingDocuments.map((doc) => (
                <Card key={doc.id} size="small" className="border-l-4 border-l-orange-500">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileTextOutlined className="text-orange-500 text-xl" />
                        <div>
                          <h3 className="font-semibold text-lg">{getDocumentTypeName(doc.type)}</h3>
                          <p className="text-gray-500 text-sm">
                            Role: {doc.role} • Created: {new Date(doc.created_at).toLocaleDateString()}
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
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleSignDocument(doc)}
                      >
                        Sign Document
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
            <iframe
              src={selectedDocument.file_url}
              className="w-full"
              style={{ height: '600px', border: '1px solid #ddd', borderRadius: '4px' }}
              title="Document Viewer"
            />
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
                <label className="block text-sm font-semibold mb-2">Draw your signature</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="border rounded bg-white w-full cursor-crosshair"
                    style={{ touchAction: 'none', display: 'block' }}
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
                    <iframe
                      src={selectedDocument.file_url}
                      className="w-full border rounded"
                      style={{ height: '400px' }}
                      title="Document Preview"
                    />
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
                disabled={!typedName || isSigning}
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

