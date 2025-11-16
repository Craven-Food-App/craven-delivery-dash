import React, { useState } from 'react';
import { Button, Card, Text, Stack, Checkbox, Alert, Divider, Box } from '@mantine/core';
import { FileText, Shield, CheckCircle } from 'lucide-react';

interface TermsAndPrivacyStepProps {
  onNext: (data: any) => void;
  applicationData: any;
}

export const TermsAndPrivacyStep: React.FC<TermsAndPrivacyStepProps> = ({ onNext }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleContinue = () => {
    if (!termsAccepted || !privacyAccepted) {
      return;
    }

    onNext({
      termsAccepted,
      privacyAccepted,
      consentsAcceptedAt: new Date().toISOString()
    });
  };

  return (
    <Card
      p="lg"
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Stack gap="lg">
        {/* Header */}
        <Stack align="center" gap="md">
          <Box
            style={{
              padding: 12,
              backgroundColor: 'rgba(255, 122, 0, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={48} style={{ color: '#ff7a00' }} />
          </Box>
          <div style={{ textAlign: 'center' }}>
            <Text fw={700} size="xl">Legal Agreements</Text>
            <Text c="dimmed" size="sm" mt="xs">
              Please review and accept our legal agreements to continue with your application
            </Text>
          </div>
        </Stack>

        {/* Important Notice */}
        <Alert
          icon={<Shield size={16} />}
          title="Before We Start"
          color="blue"
        >
          We need your consent to proceed with your application. Please read each agreement carefully.
        </Alert>

        {/* Terms of Service */}
        <Card
          p="md"
          style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
        >
          <Stack gap="sm">
            <Text fw={600} size="md">Terms of Service</Text>
            <Text size="sm" c="dimmed">
              By clicking the link below, you'll read our complete Terms of Service which
              govern your use of the Crave'N platform as a driver.
            </Text>
            <Checkbox
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.currentTarget.checked)}
              label={
                <Text size="sm">
                  I have read and agree to the{' '}
                  <a
                    href="/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/terms-of-service', '_blank');
                    }}
                    style={{ color: '#ff7a00', fontWeight: 'bold' }}
                  >
                    Terms of Service
                  </a>
                </Text>
              }
            />
          </Stack>
        </Card>

        {/* Privacy Policy */}
        <Card
          p="md"
          style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
        >
          <Stack gap="sm">
            <Text fw={600} size="md">Privacy Policy</Text>
            <Text size="sm" c="dimmed">
              Your privacy is important to us. Review our Privacy Policy to understand how
              we collect, use, and protect your personal information.
            </Text>
            <Checkbox
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.currentTarget.checked)}
              label={
                <Text size="sm">
                  I have read and agree to the{' '}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/privacy-policy', '_blank');
                    }}
                    style={{ color: '#ff7a00', fontWeight: 'bold' }}
                  >
                    Privacy Policy
                  </a>
                </Text>
              }
            />
          </Stack>
        </Card>

        <Divider />

        {/* Continue Button */}
        <Button
          size="lg"
          fullWidth
          disabled={!termsAccepted || !privacyAccepted}
          onClick={handleContinue}
          leftSection={<CheckCircle size={18} />}
          style={{
            height: '50px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '8px',
          }}
          color="#ff7a00"
        >
          Continue to Application
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          By continuing, you agree to our legal agreements and consent to processing your information
        </Text>
      </Stack>
    </Card>
  );
};
