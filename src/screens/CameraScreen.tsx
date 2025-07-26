// CameraScreen.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  NativeModules,
  Alert,
} from 'react-native';
import {
  Camera,
  PhotoFile,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

type CameraScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Camera'
>;

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    })();
  }, [hasPermission]);

  if (device == null) return <Text>Camera Not Found..</Text>;
  if (!hasPermission) return <Text>No Permission to Open camera</Text>;

  const runInference = async (path: string) => {
    try {
      const result = await NativeModules.MyTFLiteModule.runModel(path);
      console.log('Model output:', result);
    } catch (err) {
      console.error('Inference failed:', err);
    }
  };

  const processImage = async (imagePath: string) => {
    try {
      setIsProcessing(true);
      navigation.navigate('Output', { photo: { path: imagePath } });
      await runInference(imagePath);
    } catch (err) {
      Alert.alert('Error', 'Failed to process image.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        const photo: PhotoFile = await cameraRef.current.takePhoto({
          flash: 'off',
          enableShutterSound: true,
        });
        console.log('Captured photo:', photo);
        await processImage(photo.path);
      } catch (e) {
        Alert.alert('Error', 'Failed to capture or process the image.');
        console.error(e);
      }
    }
  };

  const pickImageFromGallery = async () => {
    if (isProcessing) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const asset: Asset = result.assets[0];
      const uri = asset.uri?.replace('file://', '') ?? '';
      console.log('Gallery image selected:', uri);
      await processImage(uri);
    } else if (result.didCancel) {
      console.log('Image picker cancelled');
    } else if (result.errorCode) {
      Alert.alert('Error', result.errorMessage || 'Unknown error');
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

      <TouchableOpacity
        style={styles.galleryButton}
        onPress={pickImageFromGallery}
      >
        <Icon name="image" size={28} color="#000" />
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
  galleryButton: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 50,
    elevation: 5,
  },
});
