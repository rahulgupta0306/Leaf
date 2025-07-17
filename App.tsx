import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

export default function App() {
  const handleScanLeaf = () => {
    // This will later open the camera
    console.log('Scan Leaf button pressed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plant Leaf Disease Detection</Text>

      <TouchableOpacity style={styles.button} onPress={handleScanLeaf}>
        <Feather name="camera" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Scan Leaf</Text>
      </TouchableOpacity>
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
  button: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
