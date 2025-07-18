// CameraScreen.tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type CameraScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Camera'
>;

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  if (device == null) return <Text>Camera Not Found..</Text>;
  if (!hasPermission) return <Text>No Permission to Open camera</Text>;

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
          enableShutterSound: true,
        });
        console.log('Captured photo:', photo);
        navigation.navigate('Output', { photo });
      } catch (e) {
        console.error('Error capturing photo:', e);
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
