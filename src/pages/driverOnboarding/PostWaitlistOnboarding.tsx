// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Steps, Card, Typography, Space, message, Progress, Button, Form } from 'antd';
import { UserOutlined, CarOutlined, CheckCircleOutlined, FileTextOutlined, SafetyOutlined, BankOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const STEP_ICONS = {
  0: <UserOutlined />,
  1: <CarOutlined />,
  2: <FileTextOutlined />,
  3: <BankOutlined />,
  4: <SafetyOutlined />,
  5: <CheckCircleOutlined />
};

const STEPS = [
  { title: 'Identity', description: 'Verify personal info' },
  { title: 'License', description: 'Upload license' },
  { title: 'Vehicle', description: 'Vehicle details' },
  { title: 'Insurance', description: 'Insurance info' },
  { title: 'Background', description: 'Background check' },
  { title: 'Agreements', description: 'Sign agreements' }
];

export const PostWaitlistOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDriverApplication();
  }, []);

  const loadDriverApplication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        message.error('Please log in to continue');
        navigate('/driver/auth');
        return;
      }

      const { data: application, error } = await supabase
        .from('craver_applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'invited')
        .single();

      if (error || !application) {
        message.error('No pending onboarding found');
        navigate('/driver/auth');
        return;
      }

      setApplicationData(application);

      // Determine current step based on what's been filled
      if (!application.date_of_birth) {
        setCurrentStep(0); // Identity
      } else if (!application.drivers_license) {
        setCurrentStep(1); // License
      } else if (!application.vehicle_make) {
        setCurrentStep(2); // Vehicle
      } else if (!application.insurance_provider) {
        setCurrentStep(3); // Insurance
      } else if (!application.background_check_consent) {
        setCurrentStep(4); // Background
      } else {
        setCurrentStep(5); // Agreements
      }
    } catch (error) {
      console.error('Error loading application:', error);
    }
  };

  const handleStepComplete = async (stepData: any) => {
    setApplicationData({ ...applicationData, ...stepData });
    
    // Update status based on step
    let newStatus = applicationData.status;
    if (currentStep === 0) newStatus = 'verifying_identity';
    else if (currentStep === 3) newStatus = 'collecting_docs';
    else if (currentStep === 4) newStatus = 'verifying_background';
    else if (currentStep === 5) newStatus = 'signing_agreements';

    if (newStatus !== applicationData.status) {
      await supabase
        .from('craver_applications')
        .update({ status: newStatus })
        .eq('id', applicationData.id);
    }

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
          <IdentityFormStep
            onNext={handleStepComplete}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      case 1:
        return (
          <LicenseStep
            onNext={handleStepComplete}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      case 2:
        return (
          <VehicleStep
            onNext={handleStepComplete}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      case 3:
        return (
          <InsuranceStep
            onNext={handleStepComplete}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      case 4:
        return (
          <BackgroundStep
            onNext={handleStepComplete}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      case 5:
        return (
          <AgreementsStep
            onNext={handleStepComplete}
            onBack={handleBack}
            applicationData={applicationData}
          />
        );
      case 6:
        return (
          <ReviewStep
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
        maxWidth: '900px',
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
            Complete Your Driver Application
          </Title>
          <Title level={3} style={{
            color: 'rgba(255,255,255,0.9)',
            marginTop: '8px',
            fontWeight: 'normal'
          }}>
            You're invited to become a Crave'N Feeder
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
            items={STEPS.map((step, index) => ({
              title: step.title,
              description: step.description,
              icon: currentStep === index ? STEP_ICONS[index as keyof typeof STEP_ICONS] : undefined
            }))}
            responsive
          />
          <Progress 
            percent={Math.round(((currentStep + 1) / (STEPS.length + 1)) * 100)} 
            showInfo={true}
            strokeColor="#ff7a00"
            style={{ marginTop: '24px' }}
          />
        </Card>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
};

// Placeholder steps - will implement properly
const IdentityFormStep = ({ onNext, onBack, applicationData }: any) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  return (
    <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Verify Your Identity</Title>
        <Text>Complete your identity information to continue</Text>
        <Button onClick={() => navigate('/driver-onboarding/identity')}>
          Continue to Identity Form
        </Button>
      </Space>
    </Card>
  );
};

const LicenseStep = ({ onNext, onBack }: any) => (
  <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
    <Title level={2}>License Information</Title>
    <Text>Coming soon - License upload form</Text>
  </Card>
);

const VehicleStep = ({ onNext, onBack }: any) => (
  <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
    <Title level={2}>Vehicle Details</Title>
    <Text>Coming soon - Vehicle form</Text>
  </Card>
);

const InsuranceStep = ({ onNext, onBack }: any) => (
  <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
    <Title level={2}>Insurance Information</Title>
    <Text>Coming soon - Insurance form</Text>
  </Card>
);

const BackgroundStep = ({ onNext, onBack }: any) => (
  <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
    <Title level={2}>Background Check</Title>
    <Text>Coming soon - Background consent form</Text>
  </Card>
);

const AgreementsStep = ({ onNext, onBack }: any) => (
  <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
    <Title level={2}>Sign Agreements</Title>
    <Text>Coming soon - Legal agreements</Text>
  </Card>
);

const ReviewStep = ({ applicationData }: any) => (
  <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}>
    <Title level={2}>Application Submitted</Title>
    <Text>Your application is under review</Text>
  </Card>
);

