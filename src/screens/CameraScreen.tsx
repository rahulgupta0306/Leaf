import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather'; // 👈 Make sure this is installed

export default function CameraScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    })();
  }, [hasPermission]);

  if (device == null) return <Text>Camera Not Found..</Text>;
  if (!hasPermission) return <Text>No Permission to Open camera</Text>;

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
        });
        console.log('📸 Photo captured: ', photo);
      } catch (e) {
        console.error('Capture failed:', e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        ref={cameraRef}
        photo={true}
      />

      <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
        <Icon name="camera" size={30} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 50,
    elevation: 5,
  },
});
