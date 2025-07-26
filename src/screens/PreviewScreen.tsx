import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PreviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Preview'
>;
type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export default function PreviewScreen() {
  const route = useRoute<PreviewScreenRouteProp>();
  const navigation = useNavigation<PreviewScreenNavigationProp>();
  const photo = route.params?.photo;

  const handleConfirm = () => {
    if (photo?.path) {
      navigation.navigate('Output', { photo: { path: photo.path } });
    }
  };

  const handleRetake = () => {
    navigation.navigate('Camera');
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
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
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
  image: {
    width: 280,
    height: 280,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  button: {
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#008080',
  },
  confirm: {
    backgroundColor: '#2e7d32',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
