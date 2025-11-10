import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { DownloadOutlined, ReloadOutlined, UndoOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface ExecutiveDocument {
  id: string;
  officer_name: string;
  role: string;
  type: string;
  status: string | null;
  signature_status: string | null;
  file_url: string;
  signed_file_url?: string | null;
  packet_id?: string | null;
  signing_stage?: number | null;
  signing_order?: number | null;
  required_signers?: string[] | null;
  signer_roles?: Record<string, boolean> | null;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 220;

const createBlankDataUrl = (width: number, height: number) => {
  const blank = document.createElement('canvas');
  blank.width = width;
  blank.height = height;
  const ctx = blank.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  return blank.toDataURL('image/png');
};

const ExecutiveDocumentSign = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get('token')?.trim() ?? '';

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<ExecutiveDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typedName, setTypedName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const blankSignatureRef = useRef<string | null>(null);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${(CANVAS_HEIGHT / CANVAS_WIDTH) * 100}%`;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    blankSignatureRef.current = createBlankDataUrl(CANVAS_WIDTH, CANVAS_HEIGHT);
  };

  useEffect(() => {
    initializeCanvas();
  }, []);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!token) {
        setError('This signing link is invalid.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('get-executive-document-by-token', {
        body: { token },
      });

      if (fnError || !data?.ok) {
        setError(data?.error || fnError?.message || 'Unable to load the document for signing.');
        setLoading(false);
        return;
      }

      setDocument(data.document as ExecutiveDocument);
      setTypedName(data.document?.officer_name || '');
      setLoading(false);
    };

    fetchDocument();
  }, [token]);

  const getCanvasCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      const { x, y } = getCanvasCoordinates(event);
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastPointRef.current = null;
    canvas.releasePointerCapture(event.pointerId);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture(event.pointerId);
    lastPointRef.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    lastPointRef.current = null;
  };

  const getSignatureDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL('image/png');
    if (blankSignatureRef.current && dataUrl === blankSignatureRef.current) {
      return null;
    }
    return dataUrl;
  };

  const handleSubmitSignature = async () => {
    if (!document) return;

    if (!typedName.trim()) {
      message.error('Please type your full legal name.');
      return;
    }

    const signatureDataUrl = getSignatureDataUrl();
    if (!signatureDataUrl) {
      message.error('Please draw your signature before submitting.');
      return;
    }

    setIsSigning(true);
    setSuccessMessage(null);

    const { data, error: submitError } = await supabase.functions.invoke('submit-executive-document-signature', {
      body: {
        document_id: document.id,
        typed_name: typedName.trim(),
        signature_png_base64: signatureDataUrl,
        signer_user_agent: window.navigator.userAgent,
        signature_token: token,
      },
    });

    if (submitError || !data?.ok) {
      message.error(data?.error || submitError?.message || 'Failed to submit signature. Please try again.');
      setIsSigning(false);
      return;
    }

    setSuccessMessage('Document signed successfully. Thank you! You may close this window.');
    setDocument((prev) => prev ? { ...prev, signature_status: 'signed', signed_file_url: data.signed_pdf_url } : prev);
    setIsSigning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Spin size="large" tip="Loading document..." />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Alert
          message="Invalid link"
          description="This signing link is missing a token. Please use the link that was emailed to you."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Space direction="vertical" size="large" style={{ maxWidth: 480 }}>
          <Alert
            message="Unable to load document"
            description={error}
            type="error"
            showIcon
          />
          <Button onClick={() => navigate('/')}>Return to Homepage</Button>
        </Space>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const isAlreadySigned = document.signature_status === 'signed';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card bordered={false} className="shadow-sm">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Title level={3} style={{ marginBottom: 4 }}>
                Executive Document Signature
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Review the agreement below and complete the signature to finalize your appointment.
              </Paragraph>
            </Space>
          </Card>

          {successMessage && (
            <Alert type="success" message={successMessage} showIcon />
          )}

          <Card title="Document Details" className="shadow-sm">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Document:</Text>
                <br />
                <Text>{document.type?.replace(/_/g, ' ').toUpperCase()}</Text>
              </div>
              <div>
                <Text strong>Recipient:</Text>
                <br />
                <Text>{document.officer_name}</Text>
              </div>
              <div>
                <Text strong>Status:</Text>
                <br />
                <Text>{isAlreadySigned ? 'Signed' : 'Pending Signature'}</Text>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <iframe
                title="Document Preview"
                src={document.file_url}
                style={{ width: '100%', minHeight: '600px', border: '1px solid #d9d9d9', borderRadius: 8 }}
              />
              {document.signed_file_url && (
                <Button
                  icon={<DownloadOutlined />}
                  type="default"
                  href={document.signed_file_url}
                  target="_blank"
                >
                  Download Signed Copy
                </Button>
              )}
            </Space>
          </Card>

          {!isAlreadySigned && (
            <Card title="Sign Document" className="shadow-sm">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>Type your full legal name *</Text>
                  <Input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Full Legal Name"
                    size="large"
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div>
                  <Text strong>Draw your signature *</Text>
                  <div
                    style={{
                      border: '2px dashed #d9d9d9',
                      borderRadius: 12,
                      padding: 16,
                      marginTop: 8,
                      background: '#fefefe',
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      style={{ width: '100%', borderRadius: 8, cursor: 'crosshair', background: '#ffffff', touchAction: 'none' }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerCancel}
                      onPointerLeave={handlePointerCancel}
                    />
                    <Space style={{ marginTop: 12 }}>
                      <Button icon={<UndoOutlined />} onClick={clearSignature}>
                        Clear Signature
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={initializeCanvas}>
                        Reset Canvas
                      </Button>
                    </Space>
                  </div>
                </div>

                <Alert
                  type="info"
                  message="By clicking Sign & Submit, you agree that this electronic signature is the legal equivalent of your handwritten signature."
                />

                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmitSignature}
                  loading={isSigning}
                >
                  Sign & Submit
                </Button>
              </Space>
            </Card>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ExecutiveDocumentSign;
