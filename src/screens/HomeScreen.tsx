import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';
import { SUPPORTED_CROPS } from '../constants/crops';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  // const photo = route.params?.photo;

  // 1. Initialize with a null value to represent no selection
  const [selectedCrop, setSelectedCrop] = useState(null);

  // 2. A boolean to check if a valid crop has been selected
  const isScanButtonEnabled = selectedCrop !== null;

  const handleScanLeaf = () => {
    // Check if the button is enabled before proceeding
    if (isScanButtonEnabled) {
      console.log('Selected Crop:', selectedCrop);
      // Opens camera, passing the selected crop
      navigation.navigate('Camera', { selectedCrop: selectedCrop });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plant Leaf Disease Detection</Text>

      {/* Dropdown Menu */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCrop}
          onValueChange={(itemValue, itemIndex) => setSelectedCrop(itemValue)}
          style={styles.picker}
        >
          {/* 3. Placeholder Item as the first option */}
          <Picker.Item label="Select a Crop" value={null} enabled={false} />
          {/* Mapping the rest of the crops */}
          {SUPPORTED_CROPS.map((crop, index) => (
            <Picker.Item key={index} label={crop} value={crop} />
          ))}
        </Picker>
      </View>

      {/* 4. The Scan button will be disabled based on a condition */}
      <TouchableOpacity
        style={[styles.button, !isScanButtonEnabled && styles.buttonDisabled]}
        onPress={handleScanLeaf}
        disabled={!isScanButtonEnabled}
      >
        <Feather name="camera" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Scan Leaf</Text>
      </TouchableOpacity>

      {/* {photo?.path && (
        <Image
          source={{ uri: 'file://' + photo.path }}
          style={styles.preview}
          resizeMode="cover"
        />
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fff0',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#2e7d32',
  },
  pickerContainer: {
    width: '80%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#2e7d32',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7', // A lighter color to indicate it's disabled
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  preview: {
    width: 250,
    height: 250,
    borderRadius: 10,
    marginTop: 20,
  },
});
