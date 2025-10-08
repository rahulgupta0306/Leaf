import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  NativeModules,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { MyTFLiteModule } = NativeModules;

type PreviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Preview'
>;
type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export default function PreviewScreen() {
  const route = useRoute<PreviewScreenRouteProp>();
  const navigation = useNavigation<PreviewScreenNavigationProp>();
  const photo = route.params?.photo;
  const selectedCrop = route.params?.selectedCrop;

  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!photo?.path || !selectedCrop) {
      Alert.alert('Error', 'Missing image or crop information.');
      return;
    }
    setIsLoading(true);

    // todo
    try {
      // Step 1: Crop verification
      const cropResult = await MyTFLiteModule.runCropClassifier(photo.path);
      const predictedCrop = cropResult.label;
      const cropConfidence = (cropResult.confidence * 100).toFixed(2);

      if (predictedCrop.toLowerCase() !== selectedCrop.toLowerCase()) {
        Alert.alert(
          'Crop Mismatch',
          `The model predicted this is a ${predictedCrop} leaf with ${cropConfidence}% confidence. Please go back and select the correct crop, or retake the photo.`,
          [{ text: 'OK', onPress: () => setIsLoading(false) }],
        );
        return;
      }

      // const predictedCrop = selectedCrop;

      // If crop matches, go to Output screen
      navigation.navigate('Output', {
        photo: { path: photo.path },
        selectedCrop: predictedCrop, 
      });
    } catch (e) {
      console.error('Crop classifier failed:', e);
      Alert.alert('Error', 'Failed to analyze the crop type.');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    navigation.navigate('Camera', { selectedCrop: selectedCrop });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Preview Photo</Text>
      {photo?.path && (
        <Image
          source={{ uri: 'file://' + photo.path }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRetake}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.confirm]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm</Text>
          )}
        </TouchableOpacity>
      </View>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Verifying crop type...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f0fff0',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
  },
  image: { width: 280, height: 280, borderRadius: 10 },
  buttonContainer: { flexDirection: 'row', marginTop: 30, gap: 20 },
  button: {
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#008080',
  },
  confirm: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
});
