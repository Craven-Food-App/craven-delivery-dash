// @ts-nocheck
import React from 'react';
import { Card, Typography, Space, Alert, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface WaitlistSuccessStepProps {
  applicationData: any;
}

export const WaitlistSuccessStep: React.FC<WaitlistSuccessStepProps> = ({ applicationData }) => {
  const navigate = useNavigate();

  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: 'none'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Success Icon */}
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined
            style={{ fontSize: '80px', color: '#52c41a' }}
          />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            Application Submitted!
          </Title>
          <Paragraph style={{ fontSize: '18px', color: '#595959', marginTop: '8px' }}>
            You've been placed on our waitlist
          </Paragraph>
        </div>

        {/* Info Alert */}
        <Alert
          message="You're on the Waitlist"
          description={
            <>
              <Paragraph style={{ marginBottom: '8px' }}>
                Thanks for applying! We've received your information and added you to our
                waitlist for your area.
              </Paragraph>
              <Paragraph style={{ margin: 0 }}>
                We're currently planning our launch in <strong>{applicationData.city}</strong>.
                You'll be notified by email when we're ready to activate you as a driver.
              </Paragraph>
            </>
          }
          type="info"
          icon={<ClockCircleOutlined />}
          showIcon
        />

        {/* What Happens Next */}
        <Card
          type="inner"
          style={{ backgroundColor: '#f6ffed' }}
        >
          <Title level={4} style={{ marginBottom: '16px' }}>
            What Happens Next?
          </Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>📧 Email Confirmation</Text>
              <Paragraph style={{ marginBottom: 0 }}>
                Check your inbox at <strong>{applicationData.email}</strong> for a confirmation
                message with your waitlist position.
              </Paragraph>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Text strong>📍 Area Launch</Text>
              <Paragraph style={{ marginBottom: 0 }}>
                We'll contact you when we're ready to launch in your area and need drivers.
              </Paragraph>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Text strong>✅ Background Check</Text>
              <Paragraph style={{ marginBottom: 0 }}>
                When we activate you, we'll run a background check and complete onboarding.
              </Paragraph>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Text strong>🚗 Start Earning</Text>
              <Paragraph style={{ marginBottom: 0 }}>
                Once activated, you can start accepting delivery orders and earning money!
              </Paragraph>
            </div>
          </Space>
        </Card>

        {/* Additional Info */}
        <Card
          type="inner"
          style={{ backgroundColor: '#fafafa' }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>
              <MailOutlined /> Stay Updated
            </Text>
            <Paragraph style={{ marginBottom: 0, fontSize: '14px' }}>
              We'll send you regular updates about our launch timeline and when you can
              expect to start driving. Check your email regularly!
            </Paragraph>
          </Space>
        </Card>

        {/* Footer Message */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Paragraph style={{ marginBottom: '8px' }}>
            <Text strong style={{ color: '#52c41a' }}>
              Welcome to the Crave'N Family!
            </Text>
          </Paragraph>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            We're excited to have you join us as we revolutionize food delivery.
          </Text>
        </div>
      </Space>
    </Card>
  );
};

