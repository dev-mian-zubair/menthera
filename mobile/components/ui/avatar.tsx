import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import tw from '@/lib/tailwind';
import { useTheme } from '@/constants/Theme';
import { getAvatarDisplay } from '@/lib/utils/avatar-utils';

export interface AvatarProps {
  size?: "sm" | "default" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "primary" | "secondary" | "destructive" | "purple";
  src?: ImageSourcePropType;
  alt?: string;
  fallback?: string;
  children?: React.ReactNode;
}

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ size = "default", variant = "default", src, alt, fallback, children, ...props }, ref) => {
    const { tokens } = useTheme();

    // Size mapping to TailwindCSS classes
    const sizeClasses = {
      sm: "w-8 h-8",
      default: "w-10 h-10",
      md: "w-12 h-12",
      lg: "w-16 h-16",
      xl: "w-20 h-20",
      "2xl": "w-24 h-24",
    };

    // Font size mapping
    const fontSizes = {
      sm: tokens.typography.sizes.sm,
      default: tokens.typography.sizes.sm,
      md: tokens.typography.sizes.md,
      lg: tokens.typography.sizes.lg,
      xl: tokens.typography.sizes.xl,
      "2xl": tokens.typography.sizes["2xl"],
    };

    // Variant colors
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: tokens.colors.background.primary,
            color: tokens.colors.text.primaryForeground,
          };
        case 'secondary':
          return {
            backgroundColor: tokens.colors.background.secondary,
            color: tokens.colors.text.secondaryForeground,
          };
        case 'destructive':
          return {
            backgroundColor: tokens.colors.background.destructive,
            color: tokens.colors.text.destructiveForeground,
          };
        case 'purple':
          return {
            backgroundColor: '#8B5CF6',
            color: '#FFFFFF',
          };
        default:
          return {
            backgroundColor: tokens.colors.background.card,
            color: tokens.colors.text.foreground,
          };
      }
    };

    const variantStyles = getVariantStyles();

    // Size in pixels mapping
    const sizeInPixels = {
      sm: 32,
      default: 40,
      md: 48,
      lg: 64,
      xl: 80,
      "2xl": 96,
    };

    const renderContent = () => {
      if (children) {
        return children;
      }

      if (src) {
        // Check if src is a URI string (for SVG avatars)
        if (typeof src === 'object' && 'uri' in src && src.uri) {
          const avatarDisplay = getAvatarDisplay(src.uri);

          if (avatarDisplay.type === 'svg') {
            const SvgComponent = avatarDisplay.value as React.FC<any>;
            const svgSize = sizeInPixels[size] * 0.7;
            return <SvgComponent width={svgSize} height={svgSize} />;
          }
        }

        // Fallback to regular image
        return (
          <Image
            source={src}
            style={tw`w-full h-full rounded-full`}
            resizeMode="cover"
          />
        );
      }

      if (fallback) {
        return (
          <Text style={[
            tw`font-sf-semibold text-center`,
            {
              fontSize: fontSizes[size],
              color: variantStyles.color,
            }
          ]}>
            {fallback.charAt(0).toUpperCase()}
          </Text>
        );
      }

      return (
        <Text style={[
          tw`font-sf-semibold text-center`,
          {
            fontSize: fontSizes[size],
            color: variantStyles.color,
          }
        ]}>
          ?
        </Text>
      );
    };

    return (
      <View
        ref={ref}
        style={[
          tw`items-center justify-center rounded-full ${sizeClasses[size]}`,
          { backgroundColor: variantStyles.backgroundColor }
        ]}
        {...props}
      >
        {renderContent()}
      </View>
    );
  }
);

const AvatarImage = React.forwardRef<Image, {
  src: ImageSourcePropType;
  alt?: string;
}>(
  ({ src, alt, ...props }, ref) => (
    <Image
      ref={ref}
      source={src}
      style={tw`w-full h-full rounded-full`}
      resizeMode="cover"
      {...props}
    />
  )
);

const AvatarFallback = React.forwardRef<Text, {
  children: React.ReactNode;
  size?: "sm" | "default" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "primary" | "secondary" | "destructive" | "purple";
}>(
  ({ children, size = 'default', variant = 'default', ...props }, ref) => {
    const { tokens } = useTheme();

    const fontSizes = {
      sm: tokens.typography.sizes.sm,
      default: tokens.typography.sizes.sm,
      md: tokens.typography.sizes.md,
      lg: tokens.typography.sizes.lg,
      xl: tokens.typography.sizes.xl,
      "2xl": tokens.typography.sizes["2xl"],
    };

    const getTextColor = () => {
      switch (variant) {
        case 'primary':
          return tokens.colors.text.primaryForeground;
        case 'secondary':
          return tokens.colors.text.secondaryForeground;
        case 'destructive':
          return tokens.colors.text.destructiveForeground;
        case 'purple':
          return '#FFFFFF';
        default:
          return tokens.colors.text.foreground;
      }
    };

    return (
      <Text
        ref={ref}
        style={[
          tw`font-sf-semibold text-center`,
          {
            fontSize: fontSizes[size],
            color: getTextColor(),
          }
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

Avatar.displayName = "Avatar";
AvatarImage.displayName = "AvatarImage";
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
