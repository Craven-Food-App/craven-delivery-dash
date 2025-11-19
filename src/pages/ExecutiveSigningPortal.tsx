import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Circle, Lock, FileText, AlertCircle, Download, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { message } from 'antd';
import { EnhancedSignaturePad } from '@/components/common/EnhancedSignaturePad';
import { Modal } from '@mantine/core';

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
  const [typedName, setTypedName] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [documentStages, setDocumentStages] = useState<DocumentStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [documentHtmlContent, setDocumentHtmlContent] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);

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

  // Handle document signing
  const handleSignDocument = async (signatureDataUrl: string, signatureId?: string, typedNameValue?: string) => {
    if (!currentDocument) return;

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

      // Use fetch directly for better error handling
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-executive-document-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          document_id: currentDocument.id,
          typed_name: typedNameValue?.trim() || typedName.trim() || userInfo?.name || null,
          signature_png_base64: signatureDataUrl,
          signer_ip: signerIp,
          signer_user_agent: navigator.userAgent,
          signature_token: authToken,
        }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Server error: ${response.status} ${response.statusText}`;
        console.error('Signature submission error:', { status: response.status, data });
        throw new Error(errorMessage);
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'Failed to submit signature');
      }

      const signatureData: SignedDocument = {
        signature: typedNameValue?.trim() || typedName.trim() || userInfo?.name || 'Signed',
        timestamp: new Date().toISOString(),
      };

      setSignedDocuments({
        ...signedDocuments,
        [currentDocument.id]: signatureData,
      });

      setShowSignModal(false);
      setTypedName('');
      setCurrentDocument(null);

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
                              onClick={async () => {
                                if (canSign) {
                                  setCurrentDocument(doc);
                                  setShowSignModal(true);
                                  setDocumentHtmlContent(null);
                                  
                                  if (doc.fileUrl && isHtmlFile(doc.fileUrl)) {
                                    setDocumentLoading(true);
                                    const htmlContent = await fetchHtmlContent(doc.fileUrl);
                                    setDocumentHtmlContent(htmlContent);
                                    setDocumentLoading(false);
                                  }
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
      <Modal
        opened={showSignModal}
        onClose={() => {
          if (!isSigning) {
            setShowSignModal(false);
            setTypedName('');
            setCurrentDocument(null);
            setDocumentHtmlContent(null);
          }
        }}
        title={currentDocument ? `Sign: ${currentDocument.name}` : 'Sign Document'}
        size="lg"
        fullScreen={window.innerWidth < 768}
        closeOnClickOutside={!isSigning}
        closeOnEscape={!isSigning}
      >
        {currentDocument && (
          <div className="space-y-6">
            {/* Document Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              {documentLoading ? (
                <div className="flex items-center justify-center" style={{ height: '400px' }}>
                  <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : isHtmlFile(currentDocument.fileUrl) && documentHtmlContent ? (
                <div
                  className="w-full overflow-auto p-4 bg-white"
                  style={{ height: '400px' }}
                  dangerouslySetInnerHTML={{ __html: documentHtmlContent }}
                />
              ) : (
                <iframe
                  src={currentDocument.fileUrl}
                  className="w-full"
                  style={{ height: '400px' }}
                  title="Document Preview"
                />
              )}
            </div>

            {/* Enhanced Signature Pad */}
            <EnhancedSignaturePad
              onSave={handleSignDocument}
              onCancel={() => {
                if (!isSigning) {
                  setShowSignModal(false);
                  setTypedName('');
                  setCurrentDocument(null);
                }
              }}
              width={window.innerWidth < 768 ? window.innerWidth - 64 : 600}
              height={300}
              showTypedName={true}
              typedNameLabel="Your Full Legal Name"
              documentId={currentDocument.id}
              saveToDatabase={true}
              storageBucket="documents"
              storagePath={`executive_signatures/${currentDocument.id}`}
              title="Draw Your Signature"
              description="Use your finger or stylus to sign"
              required={true}
              disabled={isSigning}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExecutiveSigningPortal;

