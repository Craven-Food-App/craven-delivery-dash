// @ts-nocheck
import React, { useState } from 'react';
import { Steps, Card, Typography, Space } from 'antd';
import { FileProtectOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { TermsAndPrivacyStep } from './steps/TermsAndPrivacyStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { WaitlistSuccessStep } from './steps/WaitlistSuccessStep';

const { Title } = Typography;

const STEP_ICONS = {
  0: <FileProtectOutlined />,
  1: <UserOutlined />,
  2: <CheckCircleOutlined />
};

export const DriverApplicationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState<any>({});

  const steps = [
    {
      title: 'Terms & Privacy',
      description: 'Review agreements'
    },
    {
      title: 'Basic Information',
      description: 'Tell us about yourself'
    },
    {
      title: 'Application Complete',
      description: 'Waitlist confirmation'
    }
  ];

  const handleStepComplete = (stepData: any) => {
    setApplicationData({ ...applicationData, ...stepData });
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <TermsAndPrivacyStep
            onNext={handleStepComplete}
            applicationData={applicationData}
          />
        );
      case 1:
        return (
          <BasicInfoStep
            onNext={handleStepComplete}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      case 2:
        return (
          <WaitlistSuccessStep
            applicationData={applicationData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff7a00 0%, #ff9f40 100%)',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={1} style={{
            color: 'white',
            margin: 0,
            fontSize: '36px',
            fontWeight: 'bold'
          }}>
            Apply to Drive with Crave'N
          </Title>
          <Title level={3} style={{
            color: 'rgba(255,255,255,0.9)',
            marginTop: '8px',
            fontWeight: 'normal'
          }}>
            Join thousands of drivers earning great money
          </Title>
        </div>

        {/* Progress Steps */}
        <Card
          style={{
            marginBottom: '24px',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Steps
            current={currentStep}
            items={steps.map((step, index) => ({
              title: step.title,
              description: step.description,
              icon: currentStep === index ? STEP_ICONS[index as keyof typeof STEP_ICONS] : undefined
            }))}
            responsive
          />
        </Card>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
};

