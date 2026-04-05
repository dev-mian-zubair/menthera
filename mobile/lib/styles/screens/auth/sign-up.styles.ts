/**
 * Sign Up Screen Style Lookup
 * Route: /auth/sign-up
 *
 * User registration screen with multi-step flow
 * Steps: email/details → verification → completion
 */

import { ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../../core/tokens';
import { shadows, flex, layouts, inputs } from '../../core/mixins';

export const signUpStyles = {
  // ==================== CONTAINERS ====================
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8' // Light, slightly off-white,
  } as ViewStyle,

  keyboardAvoid: {
    flex: 1,
  } as ViewStyle,

  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing['2xl'],
  } as ViewStyle,

  // ==================== FORM CONTAINER ====================
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  } as ViewStyle,

  // ==================== HEADER ====================
  header: {
    container: {
      marginBottom: tokens.spacing['2xl'],
    } as ViewStyle,

    title: {
      fontSize: tokens.typography.sizes['2xl'],
      fontWeight: tokens.typography.weights.bold,
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.xs,
      textAlign: 'center',
    } as TextStyle,

    subtitle: {
      fontSize: tokens.typography.sizes.base,
      fontWeight: tokens.typography.weights.regular,
      color: tokens.colors.text.secondary,
      textAlign: 'center',
      lineHeight: tokens.typography.sizes.base * tokens.typography.lineHeights.normal,
    } as TextStyle,
  },

  // ==================== STEP 1: EMAIL/DETAILS ====================
  emailStep: {
    nameRow: {
      flexDirection: 'row',
      gap: tokens.spacing.md,
      marginBottom: 0, // No extra margin, AuthInput handles spacing
    } as ViewStyle,

    nameInputContainer: {
      flex: 1,
    } as ViewStyle,

    inputGroup: {
      marginBottom: tokens.spacing.lg,
    } as ViewStyle,

    label: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.xs,
    } as TextStyle,

    input: {
      ...inputs.base,
      height: 48,
    } as ViewStyle,

    inputFocused: {
      ...inputs.focus,
    } as ViewStyle,

    inputError: {
      ...inputs.error,
    } as ViewStyle,

    errorText: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.regular,
      color: tokens.colors.text.error,
      marginTop: tokens.spacing.xs,
    } as TextStyle,
  },

  // ==================== STEP 2: VERIFICATION ====================
  verificationStep: {
    container: {
      alignItems: 'center',
    } as ViewStyle,

    message: {
      fontSize: tokens.typography.sizes.base,
      color: tokens.colors.text.secondary,
      textAlign: 'center',
      marginBottom: tokens.spacing.xl,
      lineHeight: tokens.typography.sizes.base * tokens.typography.lineHeights.normal,
    } as TextStyle,

    codeInput: {
      ...inputs.base,
      height: 56,
      fontSize: tokens.typography.sizes.xl,
      fontWeight: tokens.typography.weights.semibold,
      textAlign: 'center',
      letterSpacing: 4,
      marginBottom: tokens.spacing.lg,
    } as ViewStyle,

    resendContainer: {
      alignItems: 'center',
      marginTop: tokens.spacing.md,
    } as ViewStyle,

    resendText: {
      fontSize: tokens.typography.sizes.sm,
      color: tokens.colors.text.secondary,
    } as TextStyle,

    resendLink: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.text.link,
    } as TextStyle,
  },

  // ==================== STEP 3: COMPLETION ====================
  completionStep: {
    container: {
      alignItems: 'center',
      paddingVertical: tokens.spacing['3xl'],
    } as ViewStyle,

    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: tokens.colors.badge.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.spacing.xl,
    } as ViewStyle,

    icon: {
      size: 40,
      color: tokens.colors.badge.successText,
    },

    successTitle: {
      fontSize: tokens.typography.sizes.xl,
      fontWeight: tokens.typography.weights.bold,
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.sm,
      textAlign: 'center',
    } as TextStyle,

    successMessage: {
      fontSize: tokens.typography.sizes.base,
      color: tokens.colors.text.secondary,
      textAlign: 'center',
      marginBottom: tokens.spacing.xl,
    } as TextStyle,
  },

  // ==================== STEP INDICATORS ====================
  stepIndicators: {
    container: {
      ...flex.rowCenter,
      justifyContent: 'center',
      gap: tokens.spacing.sm,
      marginBottom: tokens.spacing.xl,
    } as ViewStyle,

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.colors.neutral.gray300,
    } as ViewStyle,

    dotActive: {
      width: 24,
      backgroundColor: tokens.colors.brand.serenityBlue,
    } as ViewStyle,
  },

  // ==================== BUTTONS ====================
  submitButton: {
    container: {
      backgroundColor: tokens.colors.button.primary,
      height: 50,
      borderRadius: tokens.radius.md,
      ...flex.center,
      ...shadows.small,
      marginBottom: tokens.spacing.lg,
    } as ViewStyle,

    containerLoading: {
      opacity: tokens.opacity.disabled,
    } as ViewStyle,

    text: {
      fontSize: tokens.typography.sizes.md,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.button.primaryText,
    } as TextStyle,
  },

  // ==================== SIGN IN LINK ====================
  signInLink: {
    container: {
      ...flex.rowCenter,
      justifyContent: 'center',
      gap: tokens.spacing.xs,
    } as ViewStyle,

    text: {
      fontSize: tokens.typography.sizes.base,
      fontWeight: tokens.typography.weights.regular,
      color: tokens.colors.text.secondary,
    } as TextStyle,

    linkText: {
      fontSize: tokens.typography.sizes.base,
      fontWeight: tokens.typography.weights.semibold,
      color: tokens.colors.text.link,
    } as TextStyle,
  },
} as const;

export type SignUpStyles = typeof signUpStyles;
