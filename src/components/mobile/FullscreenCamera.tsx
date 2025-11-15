import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Stack,
  Text,
  Button,
  ActionIcon,
  Loader,
} from '@mantine/core';
import { 
  IconCamera, 
  IconX, 
  IconRotateClockwise, 
  IconFlashlight, 
  IconFlashlightOff,
  IconCheck,
  IconArrowLeft
} from '@tabler/icons-react';

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
      pos="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      style={{ zIndex: 50, backgroundColor: 'var(--mantine-color-dark-9)', display: 'flex', flexDirection: 'column' }}
    >
      <Group
        px="md"
        py="md"
        justify="space-between"
        align="center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: 'white', flexShrink: 0 }}
      >
        <Button
          variant="subtle"
          size="sm"
          c="gray.4"
          style={{ color: 'var(--mantine-color-gray-4)' }}
          onClick={onClose}
          leftSection={<IconRotateClockwise size={16} />}
        >
          Go Back
        </Button>
        <Text size="lg" fw={700}>{title}</Text>
        <Box w={40} />
      </Group>
      
      <Box flex={1} pos="relative" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' }}>
        {capturedImage ? (
          <Box pos="relative" w="100%" h="100%">
            <Box
              component="img"
              src={capturedImage}
              alt="Captured"
              w="100%"
              h="100%"
              style={{ objectFit: 'contain' }}
            />
            <Stack
              pos="absolute"
              top={0}
              w="100%"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              p="md"
            >
              <Text style={{ textAlign: 'center', color: 'var(--mantine-color-orange-3)', fontWeight: 600 }} size="sm">
                {description}
              </Text>
            </Stack>
          </Box>
        ) : (
          <>
            {cameraError ? (
              <Stack gap="md" p="md">
                <Text c="white" size="lg" fw={700} style={{ textAlign: 'center' }}>
                  Camera Not Available
                </Text>
                <Text c="white" opacity={0.8} size="sm" style={{ textAlign: 'center' }}>
                  {description}
                </Text>
                <Button
                  onClick={capturePhoto}
                  color="orange"
                  size="lg"
                >
                  Use Demo Photo
                </Button>
              </Stack>
            ) : (
              <Box
                component="video"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                w="100%"
                h="100%"
                style={{ objectFit: 'cover' }}
                onClick={handleDoubleTap}
              />
            )}
            
            <Stack
              pos="absolute"
              top={0}
              w="100%"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
              p="md"
            >
              <Text style={{ textAlign: 'center', color: 'var(--mantine-color-orange-3)', fontWeight: 600 }} size="sm">
                {description}
              </Text>
            </Stack>
          </>
        )}
      </Box>

      <Box
        pos="absolute"
        bottom={0}
        w="100%"
        p="xl"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}
      >
        {capturedImage ? (
          <Group gap="md">
            <Button
              onClick={handleRetake}
              variant="outline"
              color="gray"
              leftSection={<IconRotateClockwise size={20} />}
            >
              Retake
            </Button>
            <Button
              onClick={handleConfirm}
              color="green"
              size="lg"
              leftSection={<IconCheck size={20} />}
            >
              Confirm
            </Button>
          </Group>
        ) : (
          <ActionIcon
            onClick={capturePhoto}
            loading={isCapturing}
            w={80}
            h={80}
            bg="white"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '4px solid var(--mantine-color-orange-6)', 
              borderRadius: '50%', 
              boxShadow: '0 20px 25px rgba(0,0,0,0.3)',
            }}
            title="Capture Photo"
          >
            {isCapturing ? (
              <Loader size="md" color="dark" />
            ) : (
              <IconCamera size={32} color="var(--mantine-color-dark-9)" />
            )}
          </ActionIcon>
        )}
      </Box>

      <Box component="canvas" ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default FullscreenCamera;
