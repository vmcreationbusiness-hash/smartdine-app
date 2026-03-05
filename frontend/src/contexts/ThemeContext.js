import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const defaultTheme = {
  restaurantName: 'SmartDine India',
  logo: '',
  backgroundImage: 'https://customer-assets.emergentagent.com/job_dine-payment-flow/artifacts/kficyfx7_Nandhana%20Palace.jpg',
  backgroundColor: '#FFF8E1',
  primaryColor: '#E65100',
  secondaryColor: '#F57F17',
  accentColor: '#B71C1C',
  overlayOpacity: 0.92
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheme();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTheme = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.get(`${BACKEND_URL}/api/manager/theme`);
      setTheme(response.data);
      
      // Update document title
      document.title = response.data.restaurantName || 'SmartDine India';
      
      // Apply theme to CSS variables
      applyTheme(response.data);
    } catch (error) {
      console.error('Error fetching theme:', error);
      setTheme(defaultTheme);
      applyTheme(defaultTheme);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (themeData) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--background-image', `url('${themeData.backgroundImage}')`);
    root.style.setProperty('--background-color', themeData.backgroundColor);
    root.style.setProperty('--primary-color', themeData.primaryColor);
    root.style.setProperty('--secondary-color', themeData.secondaryColor);
    root.style.setProperty('--accent-color', themeData.accentColor);
    root.style.setProperty('--overlay-opacity', themeData.overlayOpacity);
    
    // Also update Tailwind CSS variables
    const rgb = hexToRgb(themeData.backgroundColor);
    root.style.setProperty('--tw-bg-opacity', '1');
    
    // Force background update
    document.body.style.backgroundImage = `url('${themeData.backgroundImage}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    document.title = newTheme.restaurantName || 'SmartDine India';
  };

  const refreshTheme = () => {
    fetchTheme();
  };

  return (
    <ThemeContext.Provider value={{ theme, loading, updateTheme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
