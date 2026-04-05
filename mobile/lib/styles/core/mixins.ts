/**
 * Reusable Style Mixins
 *
 * Common style patterns that can be composed.
 * Handles platform-specific differences (iOS/Android).
 */

import { ViewStyle, TextStyle, ImageStyle, Platform } from 'react-native';
import { tokens } from './tokens';

// ==================== SHADOWS (PLATFORM-SPECIFIC) ====================

/**
 * Shadow mixins for elevation effects
 * Platform-specific: iOS uses shadowColor/shadowOffset, Android uses elevation
 */
export const shadows = {
  none: {} as ViewStyle,

  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 1,
    },
    android: {
      elevation: 1,
    },
  }) as ViewStyle,

  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }) as ViewStyle,

  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }) as ViewStyle,

  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,

  xlarge: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 12,
    },
  }) as ViewStyle,

  '2xlarge': Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    android: {
      elevation: 16,
    },
  }) as ViewStyle,
};

// ==================== FLEXBOX UTILITIES ====================

/**
 * Common flexbox layout patterns
 */
export const flex = {
  // Center alignment
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  // Row layouts
  row: {
    flexDirection: 'row',
  } as ViewStyle,

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  rowAround: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  } as ViewStyle,

  rowEvenly: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  } as ViewStyle,

  rowStart: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  } as ViewStyle,

  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  } as ViewStyle,

  // Column layouts
  column: {
    flexDirection: 'column',
  } as ViewStyle,

  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
  } as ViewStyle,

  columnBetween: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  } as ViewStyle,

  columnStart: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  } as ViewStyle,

  columnEnd: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  } as ViewStyle,

  // Flex properties
  flex1: {
    flex: 1,
  } as ViewStyle,

  flexGrow: {
    flexGrow: 1,
  } as ViewStyle,

  flexShrink: {
    flexShrink: 1,
  } as ViewStyle,

  flexWrap: {
    flexWrap: 'wrap',
  } as ViewStyle,
};

// ==================== COMMON LAYOUTS ====================

/**
 * Common layout patterns for screens and containers
 */
export const layouts = {
  // Screen containers
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  } as ViewStyle,

  screenPadded: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    paddingHorizontal: tokens.spacing.lg,
  } as ViewStyle,

  screenCentered: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  // Card layouts
  card: {
    backgroundColor: tokens.colors.background.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    ...shadows.small,
  } as ViewStyle,

  cardElevated: {
    backgroundColor: tokens.colors.background.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    ...shadows.medium,
  } as ViewStyle,

  cardFlat: {
    backgroundColor: tokens.colors.background.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
  } as ViewStyle,

  // Container layouts
  container: {
    width: '100%',
    paddingHorizontal: tokens.spacing.lg,
  } as ViewStyle,

  containerCentered: {
    width: '100%',
    paddingHorizontal: tokens.spacing.lg,
    alignItems: 'center',
  } as ViewStyle,

  // Section layouts
  section: {
    marginBottom: tokens.spacing.xl,
  } as ViewStyle,

  sectionWithGap: {
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.md,
  } as ViewStyle,
};

// ==================== BORDER UTILITIES ====================

/**
 * Border styles and utilities
 */
export const borders = {
  default: {
    borderWidth: 1,
    borderColor: tokens.colors.border.primary,
  } as ViewStyle,

  thick: {
    borderWidth: 2,
    borderColor: tokens.colors.border.primary,
  } as ViewStyle,

  focus: {
    borderWidth: 1,
    borderColor: tokens.colors.border.focus,
  } as ViewStyle,

  error: {
    borderWidth: 1,
    borderColor: tokens.colors.border.error,
  } as ViewStyle,

  success: {
    borderWidth: 1,
    borderColor: tokens.colors.border.success,
  } as ViewStyle,

  // Border radius helpers
  rounded: (radius: keyof typeof tokens.radius = 'md') =>
    ({
      borderRadius: tokens.radius[radius],
    }) as ViewStyle,

  roundedTop: (radius: keyof typeof tokens.radius = 'md') =>
    ({
      borderTopLeftRadius: tokens.radius[radius],
      borderTopRightRadius: tokens.radius[radius],
    }) as ViewStyle,

  roundedBottom: (radius: keyof typeof tokens.radius = 'md') =>
    ({
      borderBottomLeftRadius: tokens.radius[radius],
      borderBottomRightRadius: tokens.radius[radius],
    }) as ViewStyle,

  roundedLeft: (radius: keyof typeof tokens.radius = 'md') =>
    ({
      borderTopLeftRadius: tokens.radius[radius],
      borderBottomLeftRadius: tokens.radius[radius],
    }) as ViewStyle,

  roundedRight: (radius: keyof typeof tokens.radius = 'md') =>
    ({
      borderTopRightRadius: tokens.radius[radius],
      borderBottomRightRadius: tokens.radius[radius],
    }) as ViewStyle,
};

// ==================== INPUT FIELD UTILITIES ====================

/**
 * Input field styles
 */
export const inputs = {
  base: {
    backgroundColor: tokens.colors.input.background,
    borderWidth: 1,
    borderColor: tokens.colors.input.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.input.text,
    height: tokens.sizing.input.md,
  } as ViewStyle & TextStyle,

  focus: {
    borderColor: tokens.colors.input.borderFocus,
  } as ViewStyle,

  error: {
    borderColor: tokens.colors.input.borderError,
  } as ViewStyle,

  disabled: {
    backgroundColor: tokens.colors.input.backgroundDisabled,
    color: tokens.colors.text.disabled,
  } as ViewStyle & TextStyle,

  small: {
    height: tokens.sizing.input.sm,
    fontSize: tokens.typography.sizes.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
  } as ViewStyle & TextStyle,

  large: {
    height: tokens.sizing.input.lg,
    fontSize: tokens.typography.sizes.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  } as ViewStyle & TextStyle,
};

// ==================== GRADIENT PRESETS ====================

/**
 * Gradient configurations (for LinearGradient component)
 */
export const gradients = {
  overlay: {
    colors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)'] as string[],
    locations: [0, 1] as number[],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  overlayReverse: {
    colors: ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)'] as string[],
    locations: [0, 1] as number[],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  overlayStrong: {
    colors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'] as string[],
    locations: [0, 1] as number[],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  brandBlue: {
    colors: [tokens.colors.brand.serenityBlue, tokens.colors.brand.softLilac] as string[],
    locations: [0, 1] as number[],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  brandMint: {
    colors: [tokens.colors.brand.gentleMint, tokens.colors.brand.serenityBlue] as string[],
    locations: [0, 1] as number[],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  brandLilac: {
    colors: [tokens.colors.brand.softLilac, tokens.colors.brand.serenityBlue] as string[],
    locations: [0, 1] as number[],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  brandCoral: {
    colors: [tokens.colors.brand.warmCoral, tokens.colors.brand.goldenGlow] as string[],
    locations: [0, 1] as number[],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// ==================== BUTTON SIZE PRESETS ====================

/**
 * Button size presets
 */
export const buttonSizes = {
  sm: {
    height: tokens.sizing.button.sm,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.sizes.sm,
  } as ViewStyle & TextStyle,

  md: {
    height: tokens.sizing.button.md,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    fontSize: tokens.typography.sizes.base,
  } as ViewStyle & TextStyle,

  lg: {
    height: tokens.sizing.button.lg,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xl,
    fontSize: tokens.typography.sizes.md,
  } as ViewStyle & TextStyle,

  xl: {
    height: tokens.sizing.button.xl,
    paddingVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing['2xl'],
    fontSize: tokens.typography.sizes.lg,
  } as ViewStyle & TextStyle,
};

// ==================== AVATAR SIZE PRESETS ====================

/**
 * Avatar size presets
 */
export const avatarSizes = {
  xs: {
    width: tokens.sizing.avatar.xs,
    height: tokens.sizing.avatar.xs,
    borderRadius: tokens.sizing.avatar.xs / 2,
  } as ViewStyle,

  sm: {
    width: tokens.sizing.avatar.sm,
    height: tokens.sizing.avatar.sm,
    borderRadius: tokens.sizing.avatar.sm / 2,
  } as ViewStyle,

  md: {
    width: tokens.sizing.avatar.md,
    height: tokens.sizing.avatar.md,
    borderRadius: tokens.sizing.avatar.md / 2,
  } as ViewStyle,

  lg: {
    width: tokens.sizing.avatar.lg,
    height: tokens.sizing.avatar.lg,
    borderRadius: tokens.sizing.avatar.lg / 2,
  } as ViewStyle,

  xl: {
    width: tokens.sizing.avatar.xl,
    height: tokens.sizing.avatar.xl,
    borderRadius: tokens.sizing.avatar.xl / 2,
  } as ViewStyle,

  '2xl': {
    width: tokens.sizing.avatar['2xl'],
    height: tokens.sizing.avatar['2xl'],
    borderRadius: tokens.sizing.avatar['2xl'] / 2,
  } as ViewStyle,

  '3xl': {
    width: tokens.sizing.avatar['3xl'],
    height: tokens.sizing.avatar['3xl'],
    borderRadius: tokens.sizing.avatar['3xl'] / 2,
  } as ViewStyle,
};

// ==================== ICON SIZE PRESETS ====================

/**
 * Icon size presets
 */
export const iconSizes = {
  xs: tokens.sizing.icon.xs,
  sm: tokens.sizing.icon.sm,
  md: tokens.sizing.icon.md,
  lg: tokens.sizing.icon.lg,
  xl: tokens.sizing.icon.xl,
  '2xl': tokens.sizing.icon['2xl'],
};

// ==================== TYPOGRAPHY PRESETS ====================

/**
 * Common typography styles
 */
export const typography = {
  // Headings
  h1: {
    fontSize: tokens.typography.sizes['4xl'],
    fontWeight: tokens.typography.weights.bold,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes['4xl'] * tokens.typography.lineHeights.tight,
  } as TextStyle,

  h2: {
    fontSize: tokens.typography.sizes['3xl'],
    fontWeight: tokens.typography.weights.bold,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes['3xl'] * tokens.typography.lineHeights.tight,
  } as TextStyle,

  h3: {
    fontSize: tokens.typography.sizes['2xl'],
    fontWeight: tokens.typography.weights.semibold,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes['2xl'] * tokens.typography.lineHeights.snug,
  } as TextStyle,

  h4: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.semibold,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes.xl * tokens.typography.lineHeights.snug,
  } as TextStyle,

  h5: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.medium,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes.lg * tokens.typography.lineHeights.normal,
  } as TextStyle,

  h6: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes.md * tokens.typography.lineHeights.normal,
  } as TextStyle,

  // Body text
  body: {
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.regular,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes.base * tokens.typography.lineHeights.normal,
  } as TextStyle,

  bodySmall: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.regular,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes.sm * tokens.typography.lineHeights.normal,
  } as TextStyle,

  bodyLarge: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.regular,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.sizes.md * tokens.typography.lineHeights.normal,
  } as TextStyle,

  // Labels
  label: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.secondary,
  } as TextStyle,

  labelLarge: {
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.medium,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.secondary,
  } as TextStyle,

  // Caption
  caption: {
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.regular,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.secondary,
    lineHeight: tokens.typography.sizes.xs * tokens.typography.lineHeights.normal,
  } as TextStyle,

  // Links
  link: {
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.medium,
    fontFamily: tokens.typography.fontFamilyUI,
    color: tokens.colors.text.link,
    textDecorationLine: 'underline',
  } as TextStyle,
};

// ==================== POSITION UTILITIES ====================

/**
 * Positioning helpers
 */
export const position = {
  absolute: {
    position: 'absolute',
  } as ViewStyle,

  relative: {
    position: 'relative',
  } as ViewStyle,

  absoluteFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  } as ViewStyle,

  absoluteCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  } as ViewStyle,
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Create custom shadow with specific parameters
 */
export const createShadow = (
  elevation: number,
  opacity: number = 0.1,
  radius: number = elevation * 2
): ViewStyle => {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation: elevation,
    },
  }) as ViewStyle;
};

/**
 * Create custom spacing
 */
export const spacing = (multiplier: number): number => {
  return tokens.spacing.xs * multiplier; // Base unit is 4px
};
