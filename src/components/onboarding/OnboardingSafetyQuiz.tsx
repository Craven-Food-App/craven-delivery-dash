import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingSafetyQuizProps {
  onNext: () => void;
  progress?: any;
}

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What should you do if a customer asks you to enter their home?",
    options: [
      { id: 'a', text: "Enter if they seem friendly", correct: false },
      { id: 'b', text: "Politely decline and leave the order at the door", correct: true },
      { id: 'c', text: "Call support first", correct: false },
      { id: 'd', text: "Only enter if it's daytime", correct: false },
    ]
  },
  {
    id: 2,
    question: "When should you contact customer support during a delivery?",
    options: [
      { id: 'a', text: "If you can't find the address or feel unsafe", correct: true },
      { id: 'b', text: "Only after completing the delivery", correct: false },
      { id: 'c', text: "Never, handle everything yourself", correct: false },
      { id: 'd', text: "Only for payment issues", correct: false },
    ]
  },
  {
    id: 3,
    question: "What's the safest way to handle a contactless delivery?",
    options: [
      { id: 'a', text: "Ring the doorbell and wait", correct: false },
      { id: 'b', text: "Leave at door, take photo, notify customer", correct: true },
      { id: 'c', text: "Hand it to anyone who answers", correct: false },
      { id: 'd', text: "Leave it on the sidewalk", correct: false },
    ]
  },
  {
    id: 4,
    question: "While driving, you should:",
    options: [
      { id: 'a', text: "Check the app frequently while moving", correct: false },
      { id: 'b', text: "Pull over safely before checking the app", correct: true },
      { id: 'c', text: "Use the app at red lights only", correct: false },
      { id: 'd', text: "Let a passenger handle the app", correct: false },
    ]
  },
  {
    id: 5,
    question: "If a restaurant order isn't ready when you arrive, you should:",
    options: [
      { id: 'a', text: "Wait indefinitely", correct: false },
      { id: 'b', text: "Leave immediately and report it", correct: false },
      { id: 'c', text: "Contact support if wait exceeds 10-15 minutes", correct: true },
      { id: 'd', text: "Cancel the order yourself", correct: false },
    ]
  },
];

export const OnboardingSafetyQuiz = ({ onNext }: OnboardingSafetyQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const handleAnswer = (optionId: string) => {
    setAnswers({ ...answers, [currentQuestion]: optionId });
  };

  const handleNext = () => {
    if (!answers[currentQuestion]) {
      toast({
        title: "Please select an answer",
        description: "Choose an option before continuing",
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let correct = 0;
      QUIZ_QUESTIONS.forEach((q, idx) => {
        const selectedOption = q.options.find(o => o.id === answers[idx]);
        if (selectedOption?.correct) correct++;
      });
      setScore(correct);
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setScore(0);
  };

  const passed = score >= 4; // Need 80% to pass

  if (showResults) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            passed 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {passed ? (
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
          </CardTitle>
          <CardDescription>
            You got {score} out of {QUIZ_QUESTIONS.length} correct
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passed ? (
            <>
              <p className="text-center text-muted-foreground">
                Great job! You understand the safety guidelines. Let's continue with your onboarding.
              </p>
              <Button onClick={onNext} size="lg" className="w-full">
                Continue to Payment Setup
              </Button>
            </>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                You need at least 4 correct answers to pass. Please review the safety guidelines and try again.
              </p>
              <Button onClick={handleRetake} size="lg" className="w-full" variant="outline">
                Retake Quiz
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Safety Quiz
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </span>
        </div>
        <CardDescription>
          Answer these questions to demonstrate your understanding of safety protocols
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{question.question}</h3>
          
          <RadioGroup 
            value={answers[currentQuestion]} 
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          {currentQuestion > 0 && (
            <Button 
              onClick={() => setCurrentQuestion(currentQuestion - 1)} 
              variant="outline"
              className="flex-1"
            >
              Previous
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            className="flex-1"
            disabled={!answers[currentQuestion]}
          >
            {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Submit Quiz' : 'Next Question'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
