// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from 'antd';
import { supabase } from '@/integrations/supabase/client';
import Auth from './Auth';

export default function ExecutiveSignature() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [agreeOffer, setAgreeOffer] = useState(false);
  const [agreeEquity, setAgreeEquity] = useState(false);
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-executive-documents-by-token', {
          body: { token }
        });
        if (error) throw error;
        
        // Extract the first document that needs signing
        const response = data as any;
        if (response?.stages) {
          // Find first unsigned document across all stages
          for (const stage of response.stages) {
            const unsignedDoc = stage.documents?.find((d: any) => d.signature_status !== 'signed');
            if (unsignedDoc) {
              setRecord({
                ...unsignedDoc,
                employee_name: response.executive?.name || unsignedDoc.officer_name,
                employee_email: response.executive?.email || '',
                position: response.executive?.role || unsignedDoc.role,
                document_type: unsignedDoc.type
              });
              break;
            }
          }
        }
      } catch (e) {
        console.error('Failed to load documents', e);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDocuments();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, [token]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Canvas drawing handlers (same approach as driver flow)
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

  const submitSignature = async () => {
    if (!token) return;
    const canvas = canvasRef.current;
    const png = canvas?.toDataURL('image/png') || null;
    const svg = null; // optional, we only capture PNG here
    setIsSigning(true);

    // Always submit via edge function (service role), avoiding RLS/auth issues
    const signerIp = (await fetch('https://api.ipify.org?format=json').then(r => r.json()).catch(() => ({ ip: null }))).ip;
    const { error } = await supabase.functions.invoke('submit-executive-signature', {
      body: {
        token,
        typed_name: typedName || null,
        signature_png_base64: png,
        signature_svg: svg,
        signer_ip: signerIp,
        signer_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }
    }) as any;
    setIsSigning(false);
    if (!error) return navigate('/thank-you');
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!token) return <div className="p-6">Invalid or expired link.</div>;

  const hasRecord = !!record;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Review & Sign — {hasRecord ? record.document_type.replace('_',' ') : 'Offer'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 mb-4">
            {hasRecord ? (
              <>For: {record.employee_name || record.employee_email} — {record.position}</>
            ) : (
              <>Token verified. Complete your signature below.</>
            )}
          </div>
          {hasRecord && record.deferred_salary_clause && (
            <div className="p-3 mb-4 rounded-md border border-yellow-300 bg-yellow-50 text-sm">
              <div className="font-semibold mb-1">Deferred Salary Clause</div>
              <div>
                The Executive acknowledges and agrees that Crave’n Inc. is in an early, pre-revenue stage and therefore unable to provide cash compensation. Accordingly, the Executive shall initially serve on an equity-only basis. Upon the Company achieving a Funding Event—defined as closing a capital raise of at least ${record.funding_trigger || 500000} USD or achieving positive cash flow for three consecutive months—the Executive shall begin receiving a base annual salary of ${record.annual_salary ? `$${record.annual_salary.toLocaleString()}` : 'the agreed amount'} USD, payable according to Company payroll practices. No back pay or retroactive wages shall accrue prior to the Funding Event.
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold mb-2">Type your full legal name</div>
              <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Full legal name" />
              <div className="font-semibold mt-6 mb-2">Draw your signature</div>
              <div className="border-2 border-dashed rounded-lg p-2 mt-2">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border rounded bg-white w-full"
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
              <div className="mt-2">
                <Button variant="secondary" onClick={clearCanvas}>Clear</Button>
              </div>
            </div>
            <div>
              <div className="text-slate-700 font-semibold mb-2">Signature statement</div>
              <p className="text-slate-600 text-sm leading-6">
                By signing, I acknowledge that I have read and agree to the terms of the attached document. I
                understand this electronic signature is legally binding and equivalent to a handwritten signature.
              </p>
              <div className="mt-6">
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                  <input type="checkbox" checked={agreeOffer} onChange={e=>setAgreeOffer(e.target.checked)} />
                  I have read and agree to the Offer Letter
                </label>
                {hasRecord && record.document_type !== 'offer_letter' && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                    <input type="checkbox" checked={agreeEquity} onChange={e=>setAgreeEquity(e.target.checked)} />
                    I have read and agree to the Equity Offer Agreement
                  </label>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button disabled={isSigning || (!typedName) || !agreeOffer || (hasRecord && record.document_type !== 'offer_letter' && !agreeEquity)} onClick={submitSignature}>
                  {isSigning ? 'Submitting...' : 'Sign & Submit'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


