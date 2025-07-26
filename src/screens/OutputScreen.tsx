import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

type OutputScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Output'
>;
type OutputScreenRouteProp = RouteProp<RootStackParamList, 'Output'>;

export default function OutputScreen() {
  const route = useRoute<OutputScreenRouteProp>();
  const navigation = useNavigation<OutputScreenNavigationProp>();
  const photo = route.params?.photo;

  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const uploadImage = async () => {
      try {
        if (!photo || !photo.path) {
          setPrediction('No photo provided');
          setLoading(false);
          return;
        }

        const uri = photo.path.startsWith('file://')
          ? photo.path
          : `file://${photo.path}`;

        const formData = new FormData();
        formData.append('image', {
          uri,
          type: 'image/jpeg',
          name: 'leaf.jpg',
        });

        const response = await axios.post(
          'http://10.229.215.1:8082/predict',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        setPrediction(response.data.prediction);
        setConfidence(response.data.confidence);
      } catch (error) {
        console.error('Upload failed:', error);
        setPrediction('Error uploading image');
      } finally {
        setLoading(false);
      }
    };

    if (photo?.path) {
      uploadImage();
    }
  }, [photo]);

  const handleRetake = () => {
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Plant Disease Detection Result</Text>

      {photo?.path ? (
        <>
          <Image
            source={{ uri: `file://${photo.path}` }}
            style={styles.preview}
            resizeMode="cover"
          />

          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>
              📂 File: {photo.path.split('/').pop() || 'N/A'}
            </Text>
            <Text style={styles.detailText}>📍 Path: {photo.path}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          ) : (
            <>
              <Text style={styles.predictionText}>
                🧬 Prediction: {prediction}
              </Text>
              <Text style={styles.confidenceText}>
                🎯 Confidence:{' '}
                {confidence !== null ? confidence.toFixed(2) + '%' : 'N/A'}
              </Text>
            </>
          )}

          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={{ marginTop: 20, color: 'red' }}>No image to display</Text>
      )}

      <TouchableOpacity
        style={styles.bottomHomeIcon}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="home-outline" size={30} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fff0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 80,
  },
  preview: {
    width: 250,
    height: 250,
    borderRadius: 10,
  },
  detailsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  predictionText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
  },
  confidenceText: {
    fontSize: 16,
    marginTop: 4,
    color: '#444',
  },
  retakeButton: {
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#008080',
    borderRadius: 25,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomHomeIcon: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
    textAlign: 'center',
  },
});
