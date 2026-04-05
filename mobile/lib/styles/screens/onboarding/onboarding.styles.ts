/**
 * Onboarding Screen Styles
 * Route: /onboarding
 *
 * Step-by-step demographic collection for new users
 * Each step is a separate full-screen experience
 */

import { ViewStyle, TextStyle } from 'react-native';
import { tokens } from '../../core/tokens';

export const onboardingStyles = {
  // ==================== MAIN CONTAINER ====================
  container: {
    flex: 1,
    backgroundColor: '#FBF7F4',
  } as ViewStyle,

  keyboardAvoid: {
    flex: 1,
  } as ViewStyle,

  safeArea: {
    flex: 1,
    backgroundColor: '#FBF7F4',
  } as ViewStyle,

  scrollView: {
    flexGrow: 1,
    paddingVertical: tokens.spacing.lg,
  } as ViewStyle,

  // ==================== STEP SCREEN LAYOUT ====================
  stepContainer: {
    flex: 1,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: 4,
    paddingBottom: tokens.spacing.lg,
    justifyContent: 'space-between',
  } as ViewStyle,

  stepHeader: {
    marginBottom: tokens.spacing.sm,
  } as ViewStyle,

  stepTitle: {
    fontSize: 32,
    fontFamily: 'SFProDisplayBold',
    color: tokens.colors.brand.charcoal,
    marginBottom: tokens.spacing.sm,
    letterSpacing: -1,
  } as TextStyle,

  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'SFProDisplayRegular',
    color: tokens.colors.brand.charcoal,
    opacity: 0.7,
    lineHeight: 24,
    letterSpacing: -0.3,
  } as TextStyle,

  // ==================== PROGRESS ====================
  progressContainer: {
    marginBottom: tokens.spacing.lg,
  } as ViewStyle,

  progressBar: {
    height: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    overflow: 'hidden',
    marginBottom: tokens.spacing.sm,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E5E7EB',
  } as ViewStyle,

  progressFill: {
    height: '100%',
    borderRadius: 9,
    backgroundColor: '#5A86FF',
  } as ViewStyle,

  progressText: {
    fontSize: 12,
    fontFamily: 'SFProDisplayRegular',
    color: '#2C2C2C',
    letterSpacing: -0.2,
  } as TextStyle,

  // ==================== CONTENT ====================
  stepContent: {
    flex: 1,
    justifyContent: 'flex-start',
  } as ViewStyle,

  header: {
    container: {
      marginBottom: tokens.spacing['2xl'],
      marginTop: tokens.spacing.md,
    } as ViewStyle,

    title: {
      fontSize: 28,
      fontFamily: 'SFProDisplayBold',
      color: tokens.colors.brand.charcoal,
      marginBottom: tokens.spacing.sm,
      letterSpacing: -0.5,
    } as TextStyle,

    subtitle: {
      fontSize: 14,
      fontFamily: 'SFProDisplayRegular',
      color: tokens.colors.brand.charcoal,
      opacity: 0.7,
      lineHeight: 20,
      letterSpacing: -0.2,
    } as TextStyle,

    progressBar: {
      height: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 2,
      marginTop: tokens.spacing.lg,
      overflow: 'hidden',
    } as ViewStyle,

    progressFill: {
      height: '100%',
      backgroundColor: tokens.colors.brand.serenityBlue,
      borderRadius: 2,
    } as ViewStyle,
  },

  // ==================== FORM SECTIONS ====================
  section: {
    marginBottom: tokens.spacing['2xl'],
  } as ViewStyle,

  sectionLabel: {
    fontSize: 14,
    fontFamily: 'SFProDisplaySemibold',
    color: tokens.colors.brand.charcoal,
    marginBottom: tokens.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  } as TextStyle,

  // ==================== OPTION BUTTONS ====================
  optionsContainer: {
    gap: tokens.spacing.md,
  } as ViewStyle,

  optionButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  } as ViewStyle,

  optionButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#5A86FF',
  } as ViewStyle,

  optionButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,

  optionContent: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,

  optionLabel: {
    fontSize: 16,
    fontFamily: 'SFProDisplayMedium',
    color: tokens.colors.brand.charcoal,
    marginBottom: 2,
  } as TextStyle,

  optionDescription: {
    fontSize: 12,
    fontFamily: 'SFProDisplayRegular',
    color: tokens.colors.brand.charcoal,
    opacity: 0.6,
  } as TextStyle,

  optionCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5A86FF',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  optionCheckmarkText: {
    fontSize: 14,
    fontFamily: 'SFProDisplayBold',
    color: '#FFFFFF',
  } as TextStyle,

  // ==================== TEXT INPUT ====================
  inputContainer: {
    marginBottom: tokens.spacing.md,
  } as ViewStyle,

  input: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: tokens.spacing.md,
    fontSize: 16,
    fontFamily: 'SFProDisplayRegular',
    color: tokens.colors.brand.charcoal,
  } as TextStyle,

  inputFocused: {
    borderColor: tokens.colors.brand.charcoal,
    borderWidth: 1.5,
  } as ViewStyle,

  // ==================== BUTTONS ====================
  buttonContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing['2xl'],
    marginBottom: tokens.spacing.lg,
  } as ViewStyle,

  button: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  } as ViewStyle,

  buttonPrimary: {
    backgroundColor: '#5A86FF',
    borderColor: '#4A76EF',
  } as ViewStyle,

  buttonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#5A86FF',
  } as ViewStyle,

  buttonDisabled: {
    opacity: 0.5,
  } as ViewStyle,

  buttonText: {
    fontSize: 16,
    fontFamily: 'SFProDisplaySemibold',
    color: '#FFFFFF',
  } as TextStyle,

  // ==================== CONTENT SPACER ====================
  contentSpacer: {
    minHeight: 24,
  } as ViewStyle,
} as const;

export type OnboardingStyles = typeof onboardingStyles;
