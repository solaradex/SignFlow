import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StoreProvider, useStore } from './lib/store';
import { ThemeContext } from './lib/ThemeContext';
import { lightTheme, darkTheme } from './lib/theme';
import RootNavigator from './navigation/RootNavigator';

function AppContent() {
  const { state } = useStore();
  const scheme = state.settings.theme;
  const systemScheme = require('react-native').useColorScheme();
  const isDark = scheme === 'dark' || (scheme === 'system' && systemScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
