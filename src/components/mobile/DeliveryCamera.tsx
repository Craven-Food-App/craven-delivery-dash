import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryCameraProps {
  onPhotoCapture: (photo: Blob) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export const DeliveryCamera: React.FC<DeliveryCameraProps> = ({
  onPhotoCapture,
  onCancel,
  isUploading = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    console.log('Starting camera...');
    setIsLoading(true);
    setCameraError(null);
    
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      });
      
      console.log('Camera stream obtained:', mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          setIsCameraActive(true);
          setIsLoading(false);
        };
        
        // Handle video errors
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setCameraError('Error loading camera feed');
          setIsLoading(false);
        };
        
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';
      setCameraError(errorMessage);
      setIsLoading(false);
      
      toast({
        title: 'Camera Error',
        description: `Unable to access camera: ${errorMessage}`,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedPhoto || !canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onPhotoCapture(blob);
        }
      },
      'image/jpeg',
      0.8
    );
  }, [capturedPhoto, onPhotoCapture]);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Proof of Delivery</h2>
        <p className="opacity-90">Take a photo to confirm delivery</p>
      </div>

      {/* Camera/Photo Display */}
      <Card>
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
            {!capturedPhoto ? (
              <>
                {cameraError ? (
                  <div className="w-full h-full flex items-center justify-center flex-col text-white">
                    <Camera className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-center px-4">
                      Camera Error: {cameraError}
                    </p>
                    <Button 
                      onClick={startCamera} 
                      className="mt-4 bg-orange-600 hover:bg-orange-700"
                    >
                      Retry Camera
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="w-full h-full flex items-center justify-center flex-col text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <p>Starting camera...</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover bg-black"
                      style={{ transform: 'scaleX(-1)' }} // Mirror for better UX
                    />
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-4 border-2 border-white/50 rounded-lg" />
                        <div className="absolute top-4 left-4 right-4 text-center">
                          <p className="text-white text-sm bg-black/70 rounded-full px-3 py-2 inline-block">
                            📦 Position the delivery in the frame
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured delivery proof"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex gap-3 mt-4">
            {!capturedPhoto ? (
              <>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!isCameraActive || isUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isUploading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Confirm'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instructions for Browser Testing */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-yellow-800">📱 Camera Testing Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Camera works best on mobile devices or mobile browsers</li>
            <li>• In desktop browsers, you may need to grant camera permissions</li>
            <li>• Make sure your browser supports camera access (HTTPS required)</li>
            <li>• Some browsers may show a blank screen - try refreshing or using mobile</li>
          </ul>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Photo Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Make sure the delivery location is clearly visible</li>
            <li>• Include house numbers or apartment details if possible</li>
            <li>• Ensure the photo is well-lit and not blurry</li>
            <li>• Take the photo from a reasonable distance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};