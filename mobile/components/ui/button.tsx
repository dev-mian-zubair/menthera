import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '@/lib/styles/core/tokens';

export interface ButtonProps {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: ViewStyle;
}

const Button = React.forwardRef<React.ComponentRef<typeof TouchableOpacity>, ButtonProps>(
  ({
    variant = "primary",
    size = "md",
    children,
    onPress,
    disabled,
    loading,
    fullWidth,
    backgroundColor,
    textColor,
    borderColor,
    style,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    // Height based on size
    const heights = {
      sm: 44,
      md: 52,
      lg: 56,
    };

    // Border radius based on size
    const borderRadius = {
      sm: 22,
      md: 26,
      lg: 28,
    };

    // Font size based on size
    const fontSizes = {
      sm: 14,
      md: 15,
      lg: 16,
    };

    // Get background and border colors based on variant
    const getColors = () => {
      switch (variant) {
        case 'primary':
          return {
            background: tokens.colors.brand.charcoal,
            text: '#FFFFFF',
            border: tokens.colors.brand.charcoal,
          };
        case 'secondary':
          return {
            background: '#FFFFFF',
            text: tokens.colors.brand.charcoal,
            border: '#E5E7EB',
          };
        case 'outline':
          return {
            background: 'transparent',
            text: tokens.colors.brand.charcoal,
            border: '#E5E7EB',
          };
        case 'ghost':
          return {
            background: 'transparent',
            text: tokens.colors.brand.charcoal,
            border: 'transparent',
          };
        case 'destructive':
          return {
            background: '#EF4444',
            text: '#FFFFFF',
            border: '#EF4444',
          };
        default:
          return {
            background: tokens.colors.brand.charcoal,
            text: '#FFFFFF',
            border: tokens.colors.brand.charcoal,
          };
      }
    };

    const colors = getColors();

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: heights[size],
      borderRadius: borderRadius[size],
      paddingHorizontal: 20,
      backgroundColor: backgroundColor || colors.background,
      borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
      borderColor: borderColor || colors.border,
      width: fullWidth ? '100%' : undefined,
      opacity: isDisabled ? 0.6 : 1,
    };

    const finalTextColor = textColor || colors.text;

    const textStyle: TextStyle = {
      fontSize: fontSizes[size],
      fontFamily: 'SFProDisplaySemibold',
      color: finalTextColor,
      marginLeft: loading ? 8 : 0,
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[containerStyle, style]}
        ref={ref}
        {...props}
      >
        {loading && (
          <ActivityIndicator color={finalTextColor} size="small" />
        )}
        {typeof children === "string" ? (
          <Text style={textStyle}>
            {children}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

export { Button };
