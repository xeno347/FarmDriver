import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from '../screens/TasksScreen';
import RequestsScreen from '../screens/RequestsScreen';
import HomeScreen from '../screens/HomeScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Icon from 'react-native-vector-icons/Feather';
import { View, Text, StyleSheet } from 'react-native';
import useThemeColors from '../theme/useThemeColors';
import ThemeToggle from '../components/ThemeToggle';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const colors = useThemeColors();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name === 'Profile',
        headerTitle: route.name === 'Profile' ? 'DRIVER PROFILE' : undefined,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 16 },
        headerStyle: { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerRight: route.name === 'Profile' ? () => <ThemeToggle /> : undefined,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.card, // Solid background color
          borderTopWidth: 0,
          elevation: 10,              // Shadow for Android
          shadowColor: '#000',        // Shadow for iOS
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          height: 70,                 // Fixed height
          paddingBottom: 8,           // Padding for labels
          paddingTop: 8,
        },
        tabBarIcon: ({ focused }) => {
          let iconName = '';
          let iconSize = 24;
          switch (route.name) {
            case 'Tasks': iconName = 'check-square'; break;
            case 'Requests': iconName = 'inbox'; break;
            case 'Home': iconName = 'home'; iconSize = 28; break;
            case 'Vehicles': iconName = 'truck'; break;
            case 'Profile': iconName = 'user'; break;
          }

          if (route.name === 'Home') {
            return (
              <View style={styles.homeButtonWrapper}>
                <View style={styles.logoCircle}>
                  <Icon name={iconName} size={30} color={colors.primary} />
                </View>
              </View>
            );
          }
          return <Icon name={iconName} size={iconSize} color={focused ? colors.primary : colors.textMuted} />;
        },
        tabBarLabel: ({ focused }) => {
          let label = route.name;
          if (route.name === 'Home') return <Text style={{marginBottom: 20}}></Text>; // Invisible spacer for Home label
          
          return (
            <Text style={{
              color: focused ? colors.primary : colors.textSecondary,
              fontSize: 11,
              fontWeight: focused ? 'bold' : 'normal',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>{label}</Text>
          );
        },
      })}
      initialRouteName="Home"
    >
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  homeButtonWrapper: {
    position: 'absolute',
    top: -25,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#19B300', // Green border
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // logoImage removed
});

export default MainTabNavigator;