import { useTheme } from '../contexts/ThemeContext';
import { UtensilsCrossed } from 'lucide-react';

export const AppBranding = ({ size = 'medium', showName = true, className = '' }) => {
  const { theme } = useTheme();

  const sizes = {
    small: { icon: 'w-8 h-8', text: 'text-xl', container: 'w-10 h-10' },
    medium: { icon: 'w-10 h-10', text: 'text-3xl', container: 'w-16 h-16' },
    large: { icon: 'w-12 h-12', text: 'text-5xl', container: 'w-20 h-20' }
  };

  const sizeClasses = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo */}
      <div 
        className={`${sizeClasses.container} rounded-full flex items-center justify-center overflow-hidden`}
        style={{ 
          background: theme.logo ? 'white' : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
          border: `2px solid ${theme.primaryColor}`
        }}
      >
        {theme.logo ? (
          <img 
            src={theme.logo} 
            alt={theme.restaurantName} 
            className="w-full h-full object-contain"
          />
        ) : (
          <UtensilsCrossed className={`${sizeClasses.icon} text-white`} />
        )}
      </div>

      {/* Restaurant Name */}
      {showName && (
        <h1 
          className={`${sizeClasses.text} font-bold`}
          style={{ 
            fontFamily: 'Playfair Display, serif',
            color: theme.primaryColor 
          }}
        >
          {theme.restaurantName}
        </h1>
      )}
    </div>
  );
};
