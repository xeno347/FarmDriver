/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppProvider } from './src/contexts/AppContext';
import { TasksProvider } from './src/contexts/TasksContext';
import { RequestsProvider } from './src/contexts/RequestsContext';
import { VehicleProvider } from './src/contexts/VehicleContext';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <TasksProvider>
              <RequestsProvider>
                <VehicleProvider>
                  <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                  <RootNavigator />
                </VehicleProvider>
              </RequestsProvider>
            </TasksProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
