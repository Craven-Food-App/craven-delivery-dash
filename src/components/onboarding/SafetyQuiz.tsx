import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Progress, Stack, Text, Group, Box } from '@mantine/core';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Shield, CheckCircle, XCircle } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    question: "What should you do before accepting a delivery order?",
    options: ["Check the delivery distance and payment", "Accept immediately", "Ignore the details", "Wait for someone else to take it"],
    correct: 0
  },
  {
    question: "How should you handle food items during delivery?",
    options: ["Keep them in direct sunlight", "Store in insulated bags", "Leave them unsecured", "Open them to check contents"],
    correct: 1
  },
  {
    question: "What is the proper way to greet a customer?",
    options: ["Don't greet them", "Be professional and friendly", "Demand a tip", "Complain about traffic"],
    correct: 1
  },
  {
    question: "If you encounter a road closure, you should:",
    options: ["Abandon the delivery", "Find an alternate route and notify customer", "Turn off your phone", "Wait indefinitely"],
    correct: 1
  },
  {
    question: "When parking for a delivery, you must:",
    options: ["Block driveways", "Park in fire zones", "Follow all parking laws", "Double park"],
    correct: 2
  },
  {
    question: "How should you maintain your vehicle?",
    options: ["Never check it", "Regular maintenance and cleanliness", "Only fix major issues", "Ignore warning lights"],
    correct: 1
  },
  {
    question: "What should you do if the customer is not available?",
    options: ["Take the food home", "Follow app instructions and contact customer", "Leave it anywhere", "Eat the food"],
    correct: 1
  },
  {
    question: "Proper food safety means:",
    options: ["Keeping hot food hot and cold food cold", "Mixing all items together", "Leaving food unattended", "Sampling customer orders"],
    correct: 0
  },
  {
    question: "If you're involved in an accident during delivery:",
    options: ["Drive away quickly", "Stop, check for injuries, call authorities", "Blame the customer", "Continue the delivery"],
    correct: 1
  },
  {
    question: "How should you handle customer complaints?",
    options: ["Ignore them", "Argue with the customer", "Listen professionally and report to support", "Get defensive"],
    correct: 2
  },
  {
    question: "What is the proper way to communicate delays?",
    options: ["Don't communicate at all", "Proactively notify customer via app", "Blame others", "Make excuses"],
    correct: 1
  },
  {
    question: "When using your phone while driving, you should:",
    options: ["Text and drive", "Use hands-free only when legal", "Watch videos", "Take photos"],
    correct: 1
  },
  {
    question: "How should you dress for deliveries?",
    options: ["Any clothing is fine", "Clean and presentable attire", "Pajamas", "Offensive clothing"],
    correct: 1
  },
  {
    question: "What should you do with customer information?",
    options: ["Share it publicly", "Keep it confidential", "Sell it", "Post on social media"],
    correct: 1
  },
  {
    question: "If you see a safety concern at delivery location:",
    options: ["Ignore it", "Proceed anyway", "Assess situation and contact support if needed", "Confront people"],
    correct: 2
  },
  {
    question: "How should you handle restaurant staff?",
    options: ["Be rude and demanding", "Professional and courteous", "Ignore them", "Complain loudly"],
    correct: 1
  },
  {
    question: "What is required for vehicle insurance?",
    options: ["No insurance needed", "Valid insurance meeting state requirements", "Expired insurance is ok", "Someone else's insurance"],
    correct: 1
  },
  {
    question: "How often should you check your delivery bag for cleanliness?",
    options: ["Never", "Before every shift", "Once a year", "Only when visibly dirty"],
    correct: 1
  },
  {
    question: "What should you do if you receive the wrong order?",
    options: ["Deliver it anyway", "Contact restaurant and support immediately", "Keep it for yourself", "Throw it away"],
    correct: 1
  },
  {
    question: "When should you arrive for a pickup?",
    options: ["Arrive on time as indicated in app", "Show up whenever", "Hours early", "Hours late"],
    correct: 0
  },
  {
    question: "How should you handle cash payments?",
    options: ["Accept only cash", "Follow app payment procedures only", "Keep all cash", "Demand extra cash"],
    correct: 1
  },
  {
    question: "What should you wear in extreme weather?",
    options: ["Nothing special", "Appropriate gear to stay safe", "Ignore the weather", "Regular clothes only"],
    correct: 1
  },
  {
    question: "If your phone dies during delivery:",
    options: ["Give up", "Keep portable charger and car charger ready", "Go home", "Forget about order"],
    correct: 1
  },
  {
    question: "How should you verify you have correct order?",
    options: ["Don't verify", "Check order details against receipt", "Assume it's correct", "Open sealed bags"],
    correct: 1
  },
  {
    question: "What's the most important rule for delivery safety?",
    options: ["Speed over safety", "Safety first, always follow traffic laws", "Break laws if necessary", "Ignore all rules"],
    correct: 1
  }
];

export const SafetyQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(QUIZ_QUESTIONS.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const correctAnswers = answers.filter((answer, index) => 
      answer === QUIZ_QUESTIONS[index].correct
    ).length;
    const percentage = (correctAnswers / QUIZ_QUESTIONS.length) * 100;
    
    setShowResults(true);

    if (percentage >= 95) {
      completeTask();
    } else {
      toast({
        title: "Try Again",
        description: `You scored ${percentage.toFixed(0)}%. You need 95% to pass (at least 24/25 correct).`,
        variant: "destructive",
      });
    }
  };

  const completeTask = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!application) return;

      // Check for both new and old task keys
      const { data: task } = await supabase
        .from('onboarding_tasks')
        .select('id')
        .eq('driver_id', application.id)
        .in('task_key', ['pass_safety_quiz', 'safety_quiz'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (task) {
        await supabase.functions.invoke('complete-onboarding-task', {
          body: {
            task_id: task.id,
            driver_id: application.id,
          },
        });
      }

      toast({
        title: "Safety Quiz Passed! 🎉",
        description: "Congratulations! You've demonstrated excellent safety knowledge.",
      });

      setTimeout(() => navigate('/enhanced-onboarding'), 2000);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const retakeQuiz = () => {
    setCurrentQuestion(0);
    setAnswers(new Array(QUIZ_QUESTIONS.length).fill(-1));
    setShowResults(false);
  };

  const correctAnswers = answers.filter((answer, index) => 
    answer === QUIZ_QUESTIONS[index].correct
  ).length;
  const percentage = (correctAnswers / QUIZ_QUESTIONS.length) * 100;
  const passed = percentage >= 95;

  if (showResults) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)', padding: 24 }}>
        <Box style={{ maxWidth: 672, margin: '0 auto' }}>
          <Card>
            <Stack gap="lg" p="lg">
              <Group gap="xs">
                {passed ? (
                  <CheckCircle size={24} style={{ color: '#22c55e' }} />
                ) : (
                  <XCircle size={24} style={{ color: '#ef4444' }} />
                )}
                <Text fw={600} size="lg">
                  {passed ? 'Quiz Passed!' : 'Quiz Failed'}
                </Text>
              </Group>
              <Box ta="center">
                <Text fw={700} size="3xl" mb="xs" c={passed ? '#22c55e' : '#ef4444'}>
                  {percentage.toFixed(0)}%
                </Text>
                <Text size="lg" c="dimmed">
                  {correctAnswers} out of {QUIZ_QUESTIONS.length} correct
                </Text>
              </Box>

              {passed ? (
                <Card p="md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' }}>
                  <Text fw={500} c="#166534" ta="center">
                    Excellent work! You've demonstrated strong safety knowledge. Redirecting...
                  </Text>
                </Card>
              ) : (
                <Card p="md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
                  <Text c="#991b1b">
                    You need at least 95% (24/25) to pass. Please review the questions and try again.
                  </Text>
                </Card>
              )}

              {!passed && (
                <Button onClick={retakeQuiz} fullWidth color="#ff7a00">
                  Retake Quiz
                </Button>
              )}
            </Stack>
          </Card>
        </Box>
      </Box>
    );
  }

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)', padding: 24 }}>
      <Box style={{ maxWidth: 672, margin: '0 auto' }}>
        <Button
          variant="subtle"
          onClick={() => navigate('/enhanced-onboarding')}
          mb="md"
          leftSection={<ArrowLeft size={16} />}
        >
          Back to Onboarding
        </Button>

        <Card>
          <Stack gap="lg" p="lg">
            <div>
              <Group gap="xs" mb="md">
                <Shield size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
                <Text fw={600} size="lg">
                  Safety Quiz - Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
                </Text>
              </Group>
              <Progress value={progress} size="sm" color="blue" mb="xs" />
              <Text size="sm" c="dimmed">
                You need 95% (24/25 correct) to pass
              </Text>
            </div>

            <div>
              <Text fw={500} size="lg" mb="md">
                {QUIZ_QUESTIONS[currentQuestion].question}
              </Text>

              <Radio.Group
                value={answers[currentQuestion]?.toString()}
                onChange={(value) => handleAnswer(parseInt(value))}
              >
                <Stack gap="md">
                  {QUIZ_QUESTIONS[currentQuestion].options.map((option, index) => (
                    <Card
                      key={index}
                      withBorder
                      p="md"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleAnswer(index)}
                    >
                      <Group>
                        <Radio value={index.toString()} />
                        <Text style={{ flex: 1 }}>{option}</Text>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Radio.Group>
            </div>

            <Group gap="md" mt="md">
              <Button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                variant="outline"
                style={{ flex: 1 }}
                leftSection={<ArrowLeft size={16} />}
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={answers[currentQuestion] === -1}
                style={{ flex: 1 }}
                color="#ff7a00"
                rightSection={<ArrowRight size={16} />}
              >
                {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Submit Quiz' : 'Next'}
              </Button>
            </Group>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
};
