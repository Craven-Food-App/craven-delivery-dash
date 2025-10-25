import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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

      const { data: task } = await supabase
        .from('onboarding_tasks')
        .select('id')
        .eq('driver_id', application.id)
        .eq('task_key', 'pass_safety_quiz')
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {passed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                {passed ? 'Quiz Passed!' : 'Quiz Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2" style={{ color: passed ? '#22c55e' : '#ef4444' }}>
                  {percentage.toFixed(0)}%
                </div>
                <div className="text-lg text-gray-600">
                  {correctAnswers} out of {QUIZ_QUESTIONS.length} correct
                </div>
              </div>

              {passed ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium">
                    Excellent work! You've demonstrated strong safety knowledge. Redirecting...
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 mb-2">
                    You need at least 95% (24/25) to pass. Please review the questions and try again.
                  </p>
                </div>
              )}

              {!passed && (
                <Button onClick={retakeQuiz} className="w-full bg-orange-500 hover:bg-orange-600">
                  Retake Quiz
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/enhanced-onboarding')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Onboarding
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Safety Quiz - Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </CardTitle>
            <Progress value={progress} className="mt-2" />
            <p className="text-sm text-gray-600 mt-2">
              You need 95% (24/25 correct) to pass
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">
                {QUIZ_QUESTIONS[currentQuestion].question}
              </h3>

              <RadioGroup 
                value={answers[currentQuestion]?.toString()} 
                onValueChange={(value) => handleAnswer(parseInt(value))}
              >
                <div className="space-y-3">
                  {QUIZ_QUESTIONS[currentQuestion].options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={answers[currentQuestion] === -1}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Submit Quiz' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
