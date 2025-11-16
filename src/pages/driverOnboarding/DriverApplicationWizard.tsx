import React, { useState } from 'react';
import { Stepper, Card, Text, Box, Stack } from '@mantine/core';
import { FileText, User, CheckCircle } from 'lucide-react';
import { TermsAndPrivacyStep } from './steps/TermsAndPrivacyStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { WaitlistSuccessStep } from './steps/WaitlistSuccessStep';

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
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff7a00 0%, #ff9f40 100%)',
        padding: '24px'
      }}
    >
      <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <Stack align="center" gap="xs" mb="xl">
          <Text
            fw={700}
            size="2xl"
            c="white"
            style={{ fontSize: '36px' }}
          >
            Apply to Drive with Crave'N
          </Text>
          <Text size="lg" c="rgba(255,255,255,0.9)" fw={400}>
            Join thousands of drivers earning great money
          </Text>
        </Stack>

        {/* Progress Steps */}
        <Card
          p="lg"
          mb="lg"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Stepper
            active={currentStep}
          >
            {steps.map((step, index) => (
              <Stepper.Step
                key={index}
                label={step.title}
                description={step.description}
                icon={
                  index === 0 ? <FileText size={16} /> :
                  index === 1 ? <User size={16} /> :
                  <CheckCircle size={16} />
                }
              />
            ))}
          </Stepper>
        </Card>

        {/* Step Content */}
        {renderStepContent()}
      </Box>
    </Box>
  );
};
