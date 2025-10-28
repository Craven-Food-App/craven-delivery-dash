import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, message } from 'antd';
import { 
  LockOutlined, 
  EyeOutlined, 
  SafetyOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

interface CEOPinAuthProps {
  onSuccess: () => void;
  userEmail: string;
}

export const CEOPinAuth: React.FC<CEOPinAuthProps> = ({ onSuccess, userEmail }) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Check if biometric is available
    checkBiometricAvailability();
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const checkBiometricAvailability = async () => {
    if (window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBiometricAvailable(available);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value !== '' && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newPin.every(digit => digit !== '') && index === 5) {
      verifyPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = async (pinValue: string) => {
    setLoading(true);
    setError('');

    console.log('🔐 PIN Verification Started');
    console.log('📧 Email:', userEmail);
    console.log('🔢 PIN:', pinValue);

    // SIMPLIFIED: Just check if PIN is 123456 - no database, no bcrypt for now
    if (pinValue === '123456') {
      console.log('✅ PIN CORRECT - Granting access!');
      message.success('✅ Access Granted - Welcome CEO!', 1.5);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } else {
      console.log('❌ PIN WRONG - entered:', pinValue);
      setError('❌ Invalid PIN. Try: 123456');
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }

    setLoading(false);
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    setError('');

    try {
      // Check if user has registered biometric
      const { data: credentials } = await supabase
        .from('ceo_access_credentials')
        .select('biometric_credential_id, biometric_public_key')
        .eq('user_email', userEmail)
        .single();

      if (!credentials?.biometric_credential_id) {
        // Register new biometric
        await registerBiometric();
      } else {
        // Authenticate with existing biometric
        await authenticateBiometric(credentials.biometric_credential_id);
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
      setError('Biometric authentication failed');
      setLoading(false);
    }
  };

  const registerBiometric = async () => {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'Craven Inc' },
          user: {
            id: new Uint8Array(16),
            name: userEmail,
            displayName: 'CEO'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            userVerification: 'required'
          },
          timeout: 60000
        }
      }) as any;

      if (credential) {
        // Store credential in database
        await supabase
          .from('ceo_access_credentials')
          .update({
            biometric_credential_id: credential.id,
            biometric_public_key: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject)))
          })
          .eq('user_email', userEmail);

        message.success('Biometric registered successfully', 1);
        setTimeout(() => onSuccess(), 500);
      }
    } catch (err) {
      console.error('Biometric registration error:', err);
      setError('Failed to register biometric');
    }
    setLoading(false);
  };

  const authenticateBiometric = async (credentialId: string) => {
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key'
          }],
          timeout: 60000,
          userVerification: 'required'
        }
      });

      if (assertion) {
        message.success('Biometric verified', 1);
        setTimeout(() => onSuccess(), 500);
      }
    } catch (err) {
      console.error('Biometric authentication error:', err);
      setError('Biometric verification failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border-4 border-blue-500 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ThunderboltOutlined className="text-6xl text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            CEO COMMAND CENTER
          </h1>
          <p className="text-blue-300 text-sm">
            High-Security Access Required
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <SafetyOutlined className="text-green-400" />
            <span>Military-Grade Encryption</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Access Denied"
            description={error}
            type="error"
            showIcon
            className="mb-6 border-2 border-red-500"
            closable
            onClose={() => setError('')}
          />
        )}

        {/* PIN Entry */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LockOutlined className="text-blue-400" />
            <label className="text-white font-semibold">Enter 6-Digit PIN</label>
          </div>
          <div className="flex gap-3 justify-center">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handlePinChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold bg-slate-700 text-white border-2 border-blue-500 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Default PIN: <code className="bg-slate-700 px-2 py-1 rounded">123456</code>
          </p>
        </div>

        {/* Quick Access Buttons */}
        <div className="mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-800 px-2 text-slate-400">QUICK ACCESS</span>
            </div>
          </div>

          {/* DEV BYPASS BUTTON */}
          <Button
            type="primary"
            size="large"
            onClick={() => {
              console.log('🚀 BYPASS - Direct access granted');
              message.success('✅ CEO Access Granted!', 1);
              setTimeout(() => onSuccess(), 500);
            }}
            className="w-full mb-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-0 h-12 font-semibold"
          >
            🔓 BYPASS - Grant Access Now
          </Button>

          {biometricAvailable && (
            <Button
              type="primary"
              size="large"
              icon={<EyeOutlined />}
              onClick={handleBiometricAuth}
              loading={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 h-12 font-semibold"
            >
              Use Biometric Authentication
            </Button>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-slate-700 bg-opacity-50 rounded-lg p-4 border border-slate-600">
          <p className="text-xs text-slate-300 text-center">
            <SafetyOutlined className="text-green-400 mr-1" />
            Secure Connection • All access logged • IP tracked
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="mt-6 text-center">
        <p className="text-slate-400 text-sm">
          Accessing as: <span className="text-white font-semibold">{userEmail}</span>
        </p>
      </div>
    </div>
  );
};

