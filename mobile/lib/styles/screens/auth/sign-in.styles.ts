/**
 * Sign In Screen Style Lookup
 * Route: /auth/sign-in
 *
 * User authentication screen for signing into existing accounts
 */

import { ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../../core/tokens';
import { shadows, flex, layouts, inputs } from '../../core/mixins';

export const signInStyles = {
  // ==================== CONTAINERS ====================
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Light, slightly off-white
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

  // ==================== FORM INPUTS ====================
  form: {
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

  // ==================== FORGOT PASSWORD ====================
  forgotPassword: {
    container: {
      marginBottom: tokens.spacing.lg,
      alignSelf: 'flex-end',
    } as ViewStyle,

    text: {
      fontSize: tokens.typography.sizes.sm,
      fontWeight: tokens.typography.weights.medium,
      color: tokens.colors.text.primary,
    } as TextStyle,
  },

  // ==================== SUBMIT BUTTON ====================
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

  // ==================== SIGN UP LINK ====================
  signUpLink: {
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

export type SignInStyles = typeof signInStyles;
