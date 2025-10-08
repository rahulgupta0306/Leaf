import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { MyTFLiteModule } = NativeModules;

type OutputScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Output'
>;
type OutputScreenRouteProp = RouteProp<RootStackParamList, 'Output'>;

export default function OutputScreen() {
  const route = useRoute<OutputScreenRouteProp>();
  const navigation = useNavigation<OutputScreenNavigationProp>();
  const photo = route.params?.photo;
  const selectedCrop = route.params?.selectedCrop;

  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [gradcamBase64, setGradcamBase64] = useState<string | null>(null);
  const [showGradcam, setShowGradcam] = useState(false);

  useEffect(() => {
    const runDiseaseInference = async () => {
      try {
        if (!photo?.path || !selectedCrop) {
          setPrediction('No photo or crop provided');
          setLoading(false);
          return;
        }

        let diseaseResult;

        switch (selectedCrop.toLowerCase()) {
          // diseaseResult = await MyTFLiteModule.runCornDiseaseModel(photo.path);
          // uses Grad-CAM dual-output model so we also receive heatmap_base64

          case 'apple':
            diseaseResult = await MyTFLiteModule.runAppleDiseaseDualModel(
              photo.path,
            );
            break;
          case 'corn':
            diseaseResult = await MyTFLiteModule.runCornDiseaseDualModel(
              photo.path,
            );
            break;
          case 'grape':
            diseaseResult = await MyTFLiteModule.runGrapeDiseaseDualModel(
              photo.path,
            );
            break;
          case 'potato':
            diseaseResult = await MyTFLiteModule.runPotatoDiseaseDualModel(
              photo.path,
            );
            break;
          case 'tomato':
            diseaseResult = await MyTFLiteModule.runTomatoDiseaseDualModel(
              photo.path,
            );
            break;
          default:
            setPrediction(`No disease model available for ${selectedCrop}`);
            setConfidence(null);
            setLoading(false);
            return;
        }

        if (diseaseResult) {
          console.log('Full inference result:', diseaseResult);
          setPrediction(diseaseResult.label);
          setConfidence(diseaseResult.confidence * 100);
          if (diseaseResult.heatmap_base64) {
            setGradcamBase64(diseaseResult.heatmap_base64);
          }
        }
      } catch (err) {
        console.error('Inference failed:', err);
        setPrediction('Inference failed');
        setConfidence(null);
      } finally {
        setLoading(false);
      }
    };

    runDiseaseInference();
  }, [photo, selectedCrop]);

  const handleRetake = () => {
    navigation.navigate('Camera', { selectedCrop });
  };

  const toggleGradcam = () => {
    setShowGradcam(!showGradcam);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Plant Disease Detection Result</Text>

      {photo?.path ? (
        <>
          <Image
            source={{
              uri:
                showGradcam && gradcamBase64
                  ? `data:image/png;base64,${gradcamBase64}`
                  : `file://${photo.path}`,
            }}
            style={styles.preview}
            resizeMode="cover"
          />

          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          ) : (
            <>
              <View style={styles.resultsContainer}>
                <Text style={styles.resultText}>🌱 Crop: {selectedCrop}</Text>
                <Text style={styles.resultText}>🧬 Disease: {prediction}</Text>
                <Text style={styles.resultText}>
                  🎯 Confidence:{' '}
                  {confidence !== null ? confidence.toFixed(2) + '%' : 'N/A'}
                </Text>
              </View>

              {gradcamBase64 ? (
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={toggleGradcam}
                >
                  <Text style={styles.toggleButtonText}>
                    {showGradcam ? 'Show Original' : 'Show Grad-CAM'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          <TouchableOpacity
            style={[styles.retakeButton, { marginBottom: 80 }]}
            onPress={handleRetake}
          >
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
    paddingTop: 55,
  },
  preview: {
    width: 250,
    height: 250,
    borderRadius: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2e7d32',
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    marginVertical: 4,
  },
  toggleButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#008080',
    borderRadius: 25,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    marginTop: 20,
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
});
