import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
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
  const bgColor = useColorModeValue('gray.900', 'black');

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
          facingMode: 'environment',
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
          const dataUrl = canvas.toDataURL('image/jpeg');
          setCapturedImage(dataUrl);
          setIsCapturing(false);
        }
      }, 500);
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setIsCapturing(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setIsCapturing(false);
    stopCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      capturePhoto();
    }
    setLastTap(now);
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={50}
      bg={bgColor}
      display="flex"
      flexDirection="column"
    >
      <Flex
        px={4}
        py={4}
        justify="space-between"
        align="center"
        bg="blackAlpha.500"
        backdropFilter="blur(8px)"
        color="white"
        flexShrink={0}
      >
        <Button
          variant="ghost"
          size="sm"
          color="gray.400"
          _hover={{ color: 'white' }}
          onClick={onClose}
          leftIcon={<Icon as={RotateCcw} w={4} h={4} />}
        >
          Go Back
        </Button>
        <Text fontSize="lg" fontWeight="bold">{title}</Text>
        <Box w={10} />
      </Flex>
      
      <Box flex={1} position="relative" display="flex" alignItems="center" justifyContent="center" bg="black">
        {capturedImage ? (
          <Box position="relative" w="100%" h="100%">
            <Box
              as="img"
              src={capturedImage}
              alt="Captured"
              w="100%"
              h="100%"
              objectFit="contain"
            />
            <VStack
              position="absolute"
              top={0}
              w="100%"
              bg="gray.900"
              bgOpacity={0.7}
              p={4}
            >
              <Text textAlign="center" color="orange.300" fontWeight="semibold" fontSize="sm">
                {description}
              </Text>
            </VStack>
          </Box>
        ) : (
          <>
            {cameraError ? (
              <VStack spacing={4} p={4}>
                <Text color="white" fontSize="lg" fontWeight="bold" textAlign="center">
                  Camera Not Available
                </Text>
                <Text color="whiteAlpha.800" fontSize="sm" textAlign="center">
                  {description}
                </Text>
                <Button
                  onClick={capturePhoto}
                  colorScheme="orange"
                  size="lg"
                >
                  Use Demo Photo
                </Button>
              </VStack>
            ) : (
              <Box
                as="video"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                w="100%"
                h="100%"
                objectFit="cover"
                onClick={handleDoubleTap}
              />
            )}
            
            <VStack
              position="absolute"
              top={0}
              w="100%"
              bg="gray.900"
              bgOpacity={0.7}
              p={4}
            >
              <Text textAlign="center" color="orange.300" fontWeight="semibold" fontSize="sm">
                {description}
              </Text>
            </VStack>
          </>
        )}
      </Box>

      <Box
        position="absolute"
        bottom={0}
        w="100%"
        p={6}
        bg="blackAlpha.500"
        backdropFilter="blur(8px)"
        display="flex"
        justifyContent="center"
        flexShrink={0}
      >
        {capturedImage ? (
          <HStack spacing={4}>
            <Button
              onClick={handleRetake}
              variant="outline"
              colorScheme="whiteAlpha"
              leftIcon={<Icon as={RotateCcw} w={5} h={5} />}
            >
              Retake
            </Button>
            <Button
              onClick={handleConfirm}
              colorScheme="green"
              size="lg"
              leftIcon={<Icon as={Check} w={5} h={5} />}
            >
              Confirm
            </Button>
          </HStack>
        ) : (
          <Button
            onClick={capturePhoto}
            isLoading={isCapturing}
            w={20}
            h={20}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="white"
            border="4px"
            borderColor="orange.600"
            borderRadius="full"
            boxShadow="xl"
            _hover={{ bg: 'gray.100' }}
            _active={{ transform: 'scale(0.95)' }}
            title="Capture Photo"
          >
            <Icon as={Camera} w={8} h={8} color="gray.900" />
          </Button>
        )}
      </Box>

      <Box as="canvas" ref={canvasRef} display="none" />
    </Box>
  );
};

export default FullscreenCamera;
