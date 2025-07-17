import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  if (device == null) return <Text>Camera Not Found..</Text>;

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    })();
  }, []);

  return (
    <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
  );
}
