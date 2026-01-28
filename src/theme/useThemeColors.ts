import { useTheme } from '../contexts/ThemeContext';
import colors from './colors';

export default function useThemeColors() {
  const { isDarkMode } = useTheme();
  return isDarkMode ? colors.dark : colors.light;
}
