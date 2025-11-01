// @ts-nocheck
import React, { useState } from 'react';
import { Button, Card, Typography, Space, Checkbox, Alert, Divider } from 'antd';
import { FileProtectOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

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
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: 'none'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <FileProtectOutlined style={{ fontSize: '48px', color: '#ff7a00' }} />
          <Title level={2} style={{ marginTop: '16px' }}>
            Legal Agreements
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#595959' }}>
            Please review and accept our legal agreements to continue with your application
          </Paragraph>
        </div>

        {/* Important Notice */}
        <Alert
          message="Before We Start"
          description="We need your consent to proceed with your application. Please read each agreement carefully."
          type="info"
          icon={<SafetyOutlined />}
          showIcon
        />

        {/* Terms of Service */}
        <Card
          type="inner"
          style={{ backgroundColor: '#fafafa' }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: '16px' }}>
              Terms of Service
            </Text>
            <Paragraph style={{ marginBottom: '16px' }}>
              By clicking the link below, you'll read our complete Terms of Service which
              govern your use of the Crave'N platform as a driver.
            </Paragraph>
            <Checkbox
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            >
              <Text>
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
            </Checkbox>
          </Space>
        </Card>

        {/* Privacy Policy */}
        <Card
          type="inner"
          style={{ backgroundColor: '#fafafa' }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: '16px' }}>
              Privacy Policy
            </Text>
            <Paragraph style={{ marginBottom: '16px' }}>
              Your privacy is important to us. Review our Privacy Policy to understand how
              we collect, use, and protect your personal information.
            </Paragraph>
            <Checkbox
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            >
              <Text>
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
            </Checkbox>
          </Space>
        </Card>

        <Divider />

        {/* Continue Button */}
        <Button
          type="primary"
          size="large"
          block
          disabled={!termsAccepted || !privacyAccepted}
          onClick={handleContinue}
          icon={<CheckCircleOutlined />}
          style={{
            height: '50px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '8px',
            backgroundColor: '#ff7a00',
            borderColor: '#ff7a00'
          }}
        >
          Continue to Application
        </Button>

        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: '13px' }}>
          By continuing, you agree to our legal agreements and consent to processing your information
        </Text>
      </Space>
    </Card>
  );
};

