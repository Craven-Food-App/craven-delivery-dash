import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayCircle, CheckCircle } from "lucide-react";

interface OnboardingVideoProps {
  onNext: () => void;
  progress?: any;
}

export const OnboardingVideo = ({ onNext }: OnboardingVideoProps) => {
  const [videoWatched, setVideoWatched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleVideoEnd = () => {
    setVideoWatched(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-primary" />
          Orientation Video
        </CardTitle>
        <CardDescription>
          Learn how to use the Crave'N driver app and deliver like a pro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Player Placeholder */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
            <PlayCircle className="h-16 w-16 mb-4" />
            <h3 className="text-xl font-bold mb-2">Welcome to Crave'N Driving</h3>
            <p className="text-center text-sm text-gray-300 mb-4">
              This 5-minute video covers everything you need to know to get started
            </p>
            {!videoWatched && (
              <Button 
                onClick={handleVideoEnd}
                className="bg-primary hover:bg-primary/90"
              >
                Play Video
              </Button>
            )}
            {videoWatched && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">Video Completed</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Topics Covered:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>How to go online and accept delivery requests</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Picking up orders from restaurants</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Using GPS navigation for deliveries</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Completing deliveries and taking photos</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Communicating with customers</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Tracking your earnings</span>
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Checkbox 
              id="confirm-video"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              disabled={!videoWatched}
            />
            <label htmlFor="confirm-video" className="text-sm leading-relaxed cursor-pointer">
              I have watched the orientation video and understand how to use the Crave'N driver app
            </label>
          </div>
        </div>

        <Button 
          onClick={onNext} 
          size="lg" 
          className="w-full"
          disabled={!videoWatched || !confirmed}
        >
          Continue to Safety Quiz
        </Button>
      </CardContent>
    </Card>
  );
};
