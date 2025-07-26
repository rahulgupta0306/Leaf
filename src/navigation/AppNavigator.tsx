import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import CameraScreen from '../screens/CameraScreen';
import HomeScreen from '../screens/HomeScreen';
import OutputScreen from '../screens/OutputScreen';
import PreviewScreen from '../screens/PreviewScreen';
import { PhotoFile } from 'react-native-vision-camera';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Output: { photo: { path: string } } | undefined;
  Preview: { photo: { path: string } } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Output" component={OutputScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
