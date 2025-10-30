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
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-executive-signature-by-token', {
          body: { token }
        });
        if (error) throw error;
        const rec = (data as any)?.record || null;
        setRecord(rec);
      } catch (e) {
        console.error('Failed to load signature record', e);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRecord();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, [token]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false;
    const start = (e: MouseEvent | TouchEvent) => {
      drawing = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    const end = () => (drawing = false);
    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', move);
    window.addEventListener('touchend', end);
    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }, []);

  const submitSignature = async () => {
    if (!record) return;
    const canvas = canvasRef.current;
    const png = canvas?.toDataURL('image/png') || null;
    const svg = null; // optional, we only capture PNG here
    setIsSigning(true);
    const { error } = await supabase
      .from('executive_signatures')
      .update({
        typed_name: typedName || null,
        signature_png_base64: png,
        signature_svg: svg,
        signer_ip: (await fetch('https://api.ipify.org?format=json').then(r => r.json()).catch(() => ({ ip: null }))).ip,
        signer_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        signed_at: new Date().toISOString(),
      })
      .eq('id', record.id);
    setIsSigning(false);
    if (!error) {
      navigate('/thank-you');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!record) return <div className="p-6">Invalid or expired link.</div>;
  if (!session) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Please sign in to review and sign your documents.</p>
            <Button onClick={() => navigate(`/auth?next=/executive-sign?token=${encodeURIComponent(token)}`)}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Review & Sign — {record.document_type.replace('_',' ')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 mb-4">For: {record.employee_name || record.employee_email} — {record.position}</div>
          {record.deferred_salary_clause && (
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
              <div className="border rounded-md">
                <canvas ref={canvasRef} width={520} height={180} style={{ width: '100%', height: 180, display: 'block' }} />
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
                {record.document_type !== 'offer_letter' && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                    <input type="checkbox" checked={agreeEquity} onChange={e=>setAgreeEquity(e.target.checked)} />
                    I have read and agree to the Equity Offer Agreement
                  </label>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button disabled={isSigning || (!typedName) || !agreeOffer || (record.document_type !== 'offer_letter' && !agreeEquity)} onClick={submitSignature}>
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


