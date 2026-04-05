import { create } from 'twrnc';
import { AppTheme } from '@/constants/Theme';

// Create the tw function with custom configuration
const tw = create({
  theme: {
    extend: {
      fontFamily: {
        'system': ['system-ui', 'sans-serif'],
        'system-bold': ['system-ui', 'sans-serif'],
        // Add design system fonts when available
        'sf': ['SFProDisplayRegular', 'system-ui', 'sans-serif'],
        'sf-light': ['SFProDisplayLight', 'system-ui', 'sans-serif'],
        'sf-medium': ['SFProDisplayMedium', 'system-ui', 'sans-serif'],
        'sf-semibold': ['SFProDisplaySemibold', 'system-ui', 'sans-serif'],
        'sf-bold': ['SFProDisplayBold', 'system-ui', 'sans-serif'],
      },
      colors: AppTheme.colors,
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'sm': ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
        'base': ['16px', { lineHeight: '24px', letterSpacing: '0.01em' }],
        'lg': ['18px', { lineHeight: '28px', letterSpacing: '0.01em' }],
        'xl': ['20px', { lineHeight: '32px', letterSpacing: '0.01em' }],
        '2xl': ['24px', { lineHeight: '36px', letterSpacing: '0.01em' }],
        '3xl': ['30px', { lineHeight: '40px', letterSpacing: '0.01em' }],
        '4xl': ['36px', { lineHeight: '44px', letterSpacing: '0.01em' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '80px',
        '5xl': '96px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'full': '999px',
      },
    },
  },
});

export default tw;