import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  const photo = route.params?.photo;

  const handleScanLeaf = () => {
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plant Leaf Disease Detection</Text>

      <TouchableOpacity style={styles.button} onPress={handleScanLeaf}>
        <Feather name="camera" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Scan Leaf</Text>
      </TouchableOpacity>

      {photo?.path && (
        <Image
          source={{ uri: 'file://' + photo.path }}
          style={styles.preview}
          resizeMode="cover"
        />
      )}
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
    marginBottom: 20,
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
