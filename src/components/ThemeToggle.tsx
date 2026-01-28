import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <TouchableOpacity onPress={toggleTheme} accessibilityLabel="Toggle theme">
      <Icon
        name={isDarkMode ? 'moon' : 'sun'}
        size={24}
        color={isDarkMode ? '#FBBF24' : '#10B981'}
      />
    </TouchableOpacity>
  );
};

export default ThemeToggle;
