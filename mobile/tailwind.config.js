/**
 * Tailwind CSS Configuration
 *
 * Now uses centralized design tokens from lib/styles/core/tokens.ts
 * All colors, spacing, and typography are derived from the single source of truth.
 */

const { tokens } = require('./lib/styles/core/tokens.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light theme colors (from tokens)
        'light-primary': tokens.colors.background.primary,
        'light-secondary': tokens.colors.background.secondary,
        'light-tertiary': tokens.colors.background.tertiary,
        'light-border': tokens.colors.border.primary,
        'light-text': tokens.colors.text.primary,
        'light-text-secondary': tokens.colors.text.secondary,

        // Brand colors (from tokens)
        'brand-serenity-blue': tokens.colors.brand.serenityBlue,
        'brand-soft-lilac': tokens.colors.brand.softLilac,
        'brand-gentle-mint': tokens.colors.brand.gentleMint,
        'brand-warm-coral': tokens.colors.brand.warmCoral,
        'brand-golden-glow': tokens.colors.brand.goldenGlow,
        'brand-cloud-white': tokens.colors.brand.cloudWhite,
        'brand-soft-gray': tokens.colors.brand.softGray,
        'brand-charcoal': tokens.colors.brand.charcoal,
        'brand-muted-gray': tokens.colors.brand.mutedGray,

        // Legacy compatibility (from tokens)
        'brand-purple': tokens.colors.brand.serenityBlue,
        'brand-black': tokens.colors.brand.charcoal,
        'brand-white': tokens.colors.brand.cloudWhite,
        'brand-green': tokens.colors.brand.gentleMint,
        'brand-red': tokens.colors.brand.warmCoral,
        'brand-blue': tokens.colors.brand.serenityBlue,
        'brand-warning': tokens.colors.brand.goldenGlow,

        // Neutral colors (from tokens)
        'neutral-100': tokens.colors.neutral.gray100,
        'neutral-200': tokens.colors.neutral.gray200,
        'neutral-300': tokens.colors.neutral.gray300,
        'neutral-400': tokens.colors.neutral.gray400,
        'neutral-500': tokens.colors.neutral.gray500,
        'neutral-600': tokens.colors.neutral.gray600,
        'neutral-700': tokens.colors.neutral.gray700,
        'neutral-800': tokens.colors.neutral.gray800,
      },
      fontFamily: {
        'system': ['system-ui', 'sans-serif'],
        'system-bold': ['system-ui', 'sans-serif'],
        'sf': ['SFProDisplayRegular', 'system-ui', 'sans-serif'],
        'sf-light': ['SFProDisplayLight', 'system-ui', 'sans-serif'],
        'sf-medium': ['SFProDisplayMedium', 'system-ui', 'sans-serif'],
        'sf-semibold': ['SFProDisplaySemibold', 'system-ui', 'sans-serif'],
        'sf-bold': ['SFProDisplayBold', 'system-ui', 'sans-serif'],
        'gentium': ['GentiumPlus', 'serif'],
        'erode': ['ErodeRegular', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': [`${tokens.typography.sizes['2xs']}px`, { lineHeight: '16px', letterSpacing: '0.01em' }],
        'xs': [`${tokens.typography.sizes.xs}px`, { lineHeight: '16px', letterSpacing: '0.01em' }],
        'sm': [`${tokens.typography.sizes.sm}px`, { lineHeight: '20px', letterSpacing: '0.01em' }],
        'base': [`${tokens.typography.sizes.base}px`, { lineHeight: '24px', letterSpacing: '0.01em' }],
        'lg': [`${tokens.typography.sizes.lg}px`, { lineHeight: '28px', letterSpacing: '0.01em' }],
        'xl': [`${tokens.typography.sizes.xl}px`, { lineHeight: '32px', letterSpacing: '0.01em' }],
        '2xl': [`${tokens.typography.sizes['2xl']}px`, { lineHeight: '36px', letterSpacing: '0.01em' }],
        '3xl': [`${tokens.typography.sizes['3xl']}px`, { lineHeight: '40px', letterSpacing: '0.01em' }],
        '4xl': [`${tokens.typography.sizes['4xl']}px`, { lineHeight: '44px', letterSpacing: '0.01em' }],
      },
      spacing: {
        '0': `${tokens.spacing['0']}px`,
        'xs': `${tokens.spacing.xs}px`,
        'sm': `${tokens.spacing.sm}px`,
        'md': `${tokens.spacing.md}px`,
        'lg': `${tokens.spacing.lg}px`,
        'xl': `${tokens.spacing.xl}px`,
        '2xl': `${tokens.spacing['2xl']}px`,
        '3xl': `${tokens.spacing['3xl']}px`,
        '4xl': `${tokens.spacing['4xl']}px`,
        '5xl': `${tokens.spacing['5xl']}px`,
      },
      borderRadius: {
        'sm': `${tokens.radius.sm}px`,
        'md': `${tokens.radius.md}px`,
        'lg': `${tokens.radius.lg}px`,
        'xl': `${tokens.radius.xl}px`,
        '2xl': `${tokens.radius['2xl']}px`,
        'full': `${tokens.radius.full}px`,
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.15)',
        'xl': '0 12px 24px rgba(0, 0, 0, 0.18)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'fade': 'fadeIn 0.3s ease-in-out',
        'slide': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        'default': '12px',
      },
    },
  },
  plugins: [],
}
