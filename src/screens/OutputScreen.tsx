import React from 'react';
import { Image, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';

type OutputScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Output'
>;
type OutputScreenRouteProp = RouteProp<RootStackParamList, 'Output'>;

export default function OutputScreen() {
  const route = useRoute<OutputScreenRouteProp>();
  const navigation = useNavigation<OutputScreenNavigationProp>();
  const photo = route.params?.photo;

  const handleRetake = () => {
    navigation.navigate('Camera'); // Navigate back to camera screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Plant Disease Detection Result</Text>

      {photo?.path && (
        <>
          <Image
            source={{ uri: 'file://' + photo.path }}
            style={styles.preview}
            resizeMode="cover"
          />

          {/* Image details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>
              📂 File: {photo.path.split('/').pop() || 'N/A'}
            </Text>
            <Text style={styles.detailText}>
              📏 Size: {photo.width || '-'} × {photo.height || '-'}
            </Text>
            <Text style={styles.detailText}>📍 Path: {photo.path}</Text>
          </View>

          {/* Retake button */}
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Home icon at bottom center */}
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
    bottom: 30,
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
