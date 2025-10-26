import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  X, 
  RotateCcw, 
  Flashlight, 
  FlashlightOff,
  Check,
  ArrowLeft
} from 'lucide-react';

interface FullscreenCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title: string;
  description: string;
  type: 'pickup' | 'delivery';
  onVisibilityChange?: (isVisible: boolean) => void;
}

const FullscreenCamera: React.FC<FullscreenCameraProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  description,
  type,
  onVisibilityChange
}) => {
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      onVisibilityChange?.(true);
    } else {
      stopCamera();
      onVisibilityChange?.(false);
    }
  }, [isOpen, onVisibilityChange]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (cameraError) {
      // Demo mode - create a placeholder image
      setIsCapturing(true);
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = 400;
            canvas.height = 300;
            context.fillStyle = '#f3f4f6';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#6b7280';
            context.font = '16px Arial';
            context.textAlign = 'center';
            context.fillText('Demo Photo', canvas.width / 2, canvas.height / 2);
            context.fillText(`${type === 'pickup' ? 'Pickup' : 'Delivery'} Verification`, canvas.width / 2, canvas.height / 2 + 30);
          }
        }
        const imageData = canvas?.toDataURL('image/jpeg', 0.8) || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        setCapturedImage(imageData);
        setIsCapturing(false);
        console.log('Demo photo captured');
      }, 500);
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas ref not available');
      return;
    }

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.log('Canvas context not available');
      setIsCapturing(false);
      return;
    }

    // Wait for video to be ready
    if (video.readyState < 2) {
      console.log('Video not ready');
      setIsCapturing(false);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    setIsCapturing(false);
    
    console.log('Photo captured successfully');
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
    // In a real implementation, you would control the device flash here
    console.log('Flash toggled:', !flashOn);
  };

  const handleDoubleTap = () => {
    if (!capturedImage) {
      capturePhoto();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      handleDoubleTap();
    }
    
    setLastTap(currentTime);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-gray-900">
        {capturedImage ? (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={capturedImage} 
              alt="Captured photo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : cameraError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">Camera Not Available</p>
              <p className="text-sm text-gray-400 mb-4">
                Please allow camera access or use a device with a camera
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-full relative"
            onDoubleClick={handleDoubleTap}
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'manipulation' }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={() => console.log('Video metadata loaded')}
              onError={(e) => {
                console.error('Video error:', e);
                setCameraError(true);
              }}
            />
            
            {/* Camera Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Focus Frame */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50">
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg"></div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute top-20 left-4 right-4 text-center">
                <div className="bg-black bg-opacity-50 rounded-lg p-3">
                  <p className="text-white text-sm font-medium">
                    {type === 'pickup' 
                      ? 'Position the order in the frame' 
                      : 'Position the delivery location in the frame'
                    }
                  </p>
                </div>
              </div>
              
              {/* Double Tap Hint */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Double tap to capture
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black p-6">
        {capturedImage ? (
          // Photo Review Controls
          <div className="flex items-center justify-center space-x-8">
            <button 
              onClick={retakePhoto}
              className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            
            <button 
              onClick={confirmPhoto}
              className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <Check className="w-8 h-8 text-white" />
            </button>
            
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        ) : (
          // Camera Controls
          <div className="flex items-center justify-center space-x-8">
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            
            <button 
              onClick={capturePhoto}
              disabled={isCapturing}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isCapturing ? (
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-gray-900" />
              )}
            </button>
            
            <button 
              onClick={toggleFlash}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                flashOn ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {flashOn ? (
                <Flashlight className="w-6 h-6 text-white" />
              ) : (
                <FlashlightOff className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenCamera;
