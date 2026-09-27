import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from './types';
import DocumentsScreen from '../screens/DocumentsScreen';
import ActivityScreen from '../screens/ActivityScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditorScreen from '../screens/EditorScreen';
import SignScreen from '../screens/SignScreen';
import CertificateScreen from '../screens/CertificateScreen';
import SignatureManagerScreen from '../screens/SignatureManagerScreen';
import VersionsScreen from '../screens/VersionsScreen';
import TemplateGalleryScreen from '../screens/TemplateGalleryScreen';
import RequestsScreen from '../screens/RequestsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0E5F6B',
        tabBarInactiveTintColor: '#93A1A5',
        tabBarStyle: { height: 84, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="documents" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="paper-plane" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Editor" component={EditorScreen} />
      <Stack.Screen name="Sign" component={SignScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Certificate" component={CertificateScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SignatureManager" component={SignatureManagerScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Versions" component={VersionsScreen} />
      <Stack.Screen name="TemplateGallery" component={TemplateGalleryScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
    </Stack.Navigator>
  );
}
