import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission } = useCameraPermission();

  if (!hasPermission) return null;
  if (device == null) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
    </View>
  );
}
