import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Circle, Lock, FileText, AlertCircle, Download, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { message } from 'antd';

interface Document {
  id: string;
  name: string;
  required: boolean;
  fileUrl: string;
  signature_status?: string;
  signed_file_url?: string;
  signing_stage?: number;
  signing_order?: number;
  depends_on_document_id?: string;
}

interface DocumentStage {
  id: number;
  name: string;
  description: string;
  documents: Document[];
}

interface SignedDocument {
  signature: string;
  timestamp: string;
}

const ExecutiveSigningPortal = () => {
  const location = useLocation();
  const [activeStage, setActiveStage] = useState(1);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [signedDocuments, setSignedDocuments] = useState<Record<string, SignedDocument>>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [signature, setSignature] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [documentStages, setDocumentStages] = useState<DocumentStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 220;

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [showSignModal]);

  // Fetch documents by token
  useEffect(() => {
    const initializeSession = async () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('Missing authentication token');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-executive-documents-by-token', {
          body: { token },
        });

        if (fnError || !data?.ok) {
          setError(data?.error || fnError?.message || 'Failed to load signing session');
          setLoading(false);
          return;
        }

        setAuthToken(token);
        setUserInfo(data.user);
        setDocumentStages(data.documentFlow || []);
        setSignedDocuments(data.alreadySigned || {});
        setIsAuthenticated(true);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load signing session. Please contact support.');
        setLoading(false);
      }
    };

    initializeSession();
  }, [location.search]);

  // Canvas drawing handlers
  const getCanvasCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
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
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
    isDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current || !isDrawingRef.current) return;
    const ctx = canvas.getContext('2d', { alpha: true });
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
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const lastPoint = lastPointRef.current;
    if (lastPoint && isDrawingRef.current) {
      const { x, y } = getCanvasCoordinates(event);
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastPointRef.current = null;
    isDrawingRef.current = false;
    canvas.releasePointerCapture(event.pointerId);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    lastPointRef.current = null;
    isDrawingRef.current = false;
  };

  const getSignatureDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL('image/png');
    // Check if canvas is blank
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((pixel, index) => {
      return index % 4 === 3 && pixel > 0;
    });
    if (!hasDrawing) return null;
    return dataUrl;
  };

  // Check if a stage is unlocked
  const isStageUnlocked = (stageId: number) => {
    if (stageId === 1) return true;

    const previousStage = documentStages.find(s => s.id === stageId - 1);
    if (!previousStage) return false;

    return previousStage.documents.every(doc =>
      doc.required ? signedDocuments[doc.id] : true
    );
  };

  // Check if a document is signed
  const isDocumentSigned = (docId: string) => {
    return signedDocuments[docId] || false;
  };

  // Get completion percentage
  const getCompletionPercentage = () => {
    const totalDocs = documentStages.reduce((acc, stage) =>
      acc + stage.documents.filter(d => d.required).length, 0
    );
    const signedDocs = Object.keys(signedDocuments).length;
    return totalDocs > 0 ? Math.round((signedDocs / totalDocs) * 100) : 0;
  };

  // Handle document signing
  const handleSignDocument = async () => {
    if (!currentDocument) return;

    const signatureDataUrl = getSignatureDataUrl();
    if (!signatureDataUrl) {
      message.error('Please draw your signature before submitting.');
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

      const { data, error: submitError } = await supabase.functions.invoke('submit-executive-document-signature', {
        body: {
          document_id: currentDocument.id,
          typed_name: signature.trim() || userInfo?.name || null,
          signature_png_base64: signatureDataUrl,
          signer_ip: signerIp,
          signer_user_agent: navigator.userAgent,
          signature_token: authToken,
        },
      });

      if (submitError || !data?.ok) {
        throw new Error(data?.error || submitError?.message || 'Failed to submit signature');
      }

      const signatureData: SignedDocument = {
        signature: signature.trim() || userInfo?.name || 'Signed',
        timestamp: new Date().toISOString(),
      };

      setSignedDocuments({
        ...signedDocuments,
        [currentDocument.id]: signatureData,
      });

      setShowSignModal(false);
      setSignature('');
      setCurrentDocument(null);
      clearSignature();

      // Check if stage is complete and advance
      const stage = documentStages.find(s => s.id === activeStage);
      const allRequiredSigned = stage?.documents
        .filter(doc => doc.required)
        .every(doc => signedDocuments[doc.id] || doc.id === currentDocument.id);

      if (allRequiredSigned && activeStage < documentStages.length) {
        const nextStage = documentStages.find(s => s.id === activeStage + 1);
        if (nextStage && isStageUnlocked(activeStage + 1)) {
          setTimeout(() => setActiveStage(activeStage + 1), 500);
        }
      }

      message.success('Document signed successfully!');
    } catch (err: any) {
      message.error(err?.message || 'Failed to submit signature. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <Loader className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Your Documents</h1>
          <p className="text-gray-600">Please wait while we prepare your signing session...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = 'mailto:support@cravenusa.com'}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <Lock className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Access Required</h1>
            <p className="text-gray-600 mb-6">
              Please access this portal through the secure link sent to your email.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-yellow-600 inline mr-2" />
              <span className="text-sm text-yellow-800">
                This portal requires a valid authentication token
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Executive Document Signing Portal</h1>
              <p className="text-sm text-gray-600 mt-1">{userInfo?.company}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userInfo?.name}</p>
              <p className="text-xs text-gray-600">{userInfo?.title}</p>
              <p className="text-xs text-gray-500">{userInfo?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-indigo-600">{getCompletionPercentage()}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Stage Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Signing Stages</h2>
              <nav className="space-y-2">
                {documentStages.map((stage) => {
                  const unlocked = isStageUnlocked(stage.id);
                  const requiredDocs = stage.documents.filter(d => d.required);
                  const allRequiredSigned = requiredDocs.every(doc => isDocumentSigned(doc.id));

                  return (
                    <button
                      key={stage.id}
                      onClick={() => unlocked && setActiveStage(stage.id)}
                      disabled={!unlocked}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        activeStage === stage.id
                          ? 'bg-indigo-50 border-2 border-indigo-500'
                          : unlocked
                          ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          : 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {allRequiredSigned ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : unlocked ? (
                            <Circle className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500">Stage {stage.id}</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">{stage.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {requiredDocs.filter(d => isDocumentSigned(d.id)).length}/{requiredDocs.length} signed
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content - Documents */}
          <div className="lg:col-span-3">
            {documentStages.map((stage) =>
              activeStage === stage.id && (
                <div key={stage.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Stage {stage.id}: {stage.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-2">{stage.description}</p>
                  </div>

                  <div className="space-y-4">
                    {stage.documents.map((doc) => {
                      const signed = isDocumentSigned(doc.id);
                      const signedInfo = signedDocuments[doc.id];
                      const canSign = !doc.depends_on_document_id || isDocumentSigned(doc.depends_on_document_id);

                      return (
                        <div
                          key={doc.id}
                          className={`border rounded-lg p-5 transition-all ${
                            signed
                              ? 'border-green-300 bg-green-50'
                              : canSign
                              ? 'border-gray-200 bg-white hover:border-indigo-300'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="flex-shrink-0">
                                {signed ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                  <FileText className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{doc.name}</h3>
                                  {doc.required && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                      Required
                                    </span>
                                  )}
                                  {!canSign && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                      Waiting for Previous Document
                                    </span>
                                  )}
                                </div>
                                {signed ? (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-green-700">
                                      ✓ Signed by {signedInfo.signature}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      {new Date(signedInfo.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Review and sign this document to continue
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                              >
                                <Download className="w-4 h-4" />
                                Preview
                              </a>
                              {!signed && (
                                <button
                                  onClick={() => {
                                    if (canSign) {
                                      setCurrentDocument(doc);
                                      setShowSignModal(true);
                                    }
                                  }}
                                  disabled={!canSign}
                                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    canSign
                                      ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                                      : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                                  }`}
                                >
                                  Sign Document
                                </button>
                              )}
                              {signed && doc.signed_file_url && (
                                <a
                                  href={doc.signed_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors inline-flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Download Signed
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stage Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setActiveStage(Math.max(1, activeStage - 1))}
                      disabled={activeStage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous Stage
                    </button>
                    <button
                      onClick={() => {
                        const nextStage = documentStages.find(s => s.id === activeStage + 1);
                        if (nextStage && isStageUnlocked(activeStage + 1)) {
                          setActiveStage(activeStage + 1);
                        }
                      }}
                      disabled={
                        activeStage === documentStages.length ||
                        !stage.documents.filter(d => d.required).every(doc => isDocumentSigned(doc.id))
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {activeStage === documentStages.length ? 'Complete' : 'Next Stage'}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Completion Message */}
            {getCompletionPercentage() === 100 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-900 mb-2">All Documents Signed!</h3>
                <p className="text-green-700 mb-4">
                  You have successfully completed the executive document signing process.
                </p>
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Download Complete Package
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Signature Modal */}
      {showSignModal && currentDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Sign Document</h3>
              <p className="text-sm text-gray-600 mt-1">{currentDocument.name}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Document Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={currentDocument.fileUrl}
                  className="w-full"
                  style={{ height: '400px' }}
                  title="Document Preview"
                />
              </div>

              {/* Agreement Checkbox */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600" required />
                  <span className="text-sm text-gray-700">
                    I have read, understood, and agree to the terms and conditions outlined in this document.
                    I acknowledge that my electronic signature has the same legal effect as a handwritten signature.
                  </span>
                </label>
              </div>

              {/* Signature Canvas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draw Your Signature *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full border rounded cursor-crosshair"
                    style={{
                      touchAction: 'none',
                      display: 'block',
                      background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Signature
                </button>
              </div>

              {/* Signature Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Legal Name (Electronic Signature)
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full legal name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  By typing your name above, you are creating a legally binding electronic signature
                </p>
              </div>

              {/* Security Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1">
                <p><strong>Audit Trail:</strong> This signature will be recorded with timestamp, IP address, and device information</p>
                <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Email:</strong> {userInfo?.email}</p>
                <p><strong>Document:</strong> {currentDocument.id}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSignModal(false);
                  setSignature('');
                  setCurrentDocument(null);
                  clearSignature();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignDocument}
                disabled={isSigning || !signature.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSigning ? 'Signing...' : 'Sign & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveSigningPortal;

