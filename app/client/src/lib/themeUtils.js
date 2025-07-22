/**
 * Theme utility functions for consistent theme handling across the app
 */

// Initialize theme on app start
export function initializeTheme() {
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (storedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // Follow system preference if no stored preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
}

// Check if dark mode is currently active
export function isDarkModeActive() {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

// Get current theme mode including system
export function getCurrentTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) return storedTheme;
  return 'system';
}

// Toggle between light and dark themes
export function toggleTheme() {
  const currentlyDark = isDarkModeActive();
  const newMode = currentlyDark ? 'light' : 'dark';
  setTheme(newMode);
  return !currentlyDark;
}

// Set theme directly
export function setTheme(mode) {
  if (!['dark', 'light', 'system'].includes(mode)) {
    throw new Error('Theme must be "dark", "light", or "system"');
  }
  
  if (mode === 'system') {
    localStorage.removeItem('theme');
    // Apply system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } else {
    localStorage.setItem('theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  // Notify components of theme change
  window.dispatchEvent(new CustomEvent('themechange', { 
    detail: { theme: mode, isDark: isDarkModeActive() } 
  }));
}

// Setup system preference listener
export function setupSystemPreferenceListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = () => {
    // Only follow system preference if no stored preference
    if (!localStorage.getItem('theme')) {
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Notify components
      window.dispatchEvent(new CustomEvent('themechange', { 
        detail: { theme: 'system', isDark: mediaQuery.matches } 
      }));
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}
