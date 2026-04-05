import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cva } from '@/lib/utils';

const cardVariants = cva(
  "bg-light-secondary rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-light-secondary",
        elevated: "bg-light-primary shadow-md",
        outlined: "bg-transparent border border-light-border",
      },
      size: {
        sm: "p-sm",
        default: "p-md",
        lg: "p-lg",
        xl: "p-xl",
      },
      radius: {
        default: "rounded-lg",
        sm: "rounded-md",
        lg: "rounded-xl",
        full: "rounded-2xl",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "default",
    },
  }
);

export interface CardProps {
  variant?: "default" | "elevated" | "outlined";
  size?: "sm" | "default" | "lg" | "xl";
  radius?: "default" | "sm" | "lg" | "full";
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export interface CardImageProps {
  source: { uri: string } | number;
  height?: number;
  className?: string;
  overlay?: boolean;
  overlayContent?: React.ReactNode;
}

export interface CardAgentProps {
  name: string;
  avatar: { uri: string } | number;
  status?: "online" | "away" | "busy" | "offline";
  description?: string;
  rating?: number;
  specialties?: string[];
  onPress?: () => void;
  animate?: boolean;
}

const Card = React.forwardRef<View, CardProps>(
  ({
    className,
    variant = "default",
    size = "default",
    radius = "default",
    children,
    animate = true,
    onPress,
    disabled = false,
    ...props
  }, ref) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (animate) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [animate, fadeAnim]);

    const handlePressIn = () => {
      if (!disabled && onPress) {
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    };

    const handlePressOut = () => {
      if (!disabled && onPress) {
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    };

    const CardComponent = (
      <Animated.View
        ref={ref}
        style={{
          opacity: animate ? fadeAnim : 1,
          transform: [{ scale: scaleAnim }],
        }}
        className={cardVariants({ variant, size, radius, className })}
        {...props}
      >
        {children}
      </Animated.View>
    );

    if (onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
        >
          {CardComponent}
        </TouchableOpacity>
      );
    }

    return CardComponent;
  }
);

const CardHeader = React.forwardRef<View, { children: React.ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={`mb-md ${className || ''}`} {...props}>
      {children}
    </View>
  )
);

const CardTitle = React.forwardRef<Text, { children: React.ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => (
    <Text
      ref={ref}
      className={`text-lg font-bold text-light-text ${className || ''}`}
      {...props}
    >
      {children}
    </Text>
  )
);

const CardDescription = React.forwardRef<Text, { children: React.ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => (
    <Text
      ref={ref}
      className={`text-sm text-light-text-secondary mt-xs ${className || ''}`}
      {...props}
    >
      {children}
    </Text>
  )
);

const CardContent = React.forwardRef<View, { children: React.ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={className} {...props}>
      {children}
    </View>
  )
);

const CardFooter = React.forwardRef<View, { children: React.ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={`mt-md flex-row items-center ${className || ''}`} {...props}>
      {children}
    </View>
  )
);

const CardImage = React.forwardRef<View, CardImageProps>(
  ({ source, height = 200, className, overlay = false, overlayContent, ...props }, ref) => (
    <View ref={ref} className={`relative overflow-hidden ${className || ''}`} {...props}>
      <Image
        source={source}
        className={`w-full rounded-t-lg`}
        style={{ height }}
        resizeMode="cover"
      />
      {overlay && overlayContent && (
        <View className="absolute inset-0 bg-black/40 justify-end p-md">
          {overlayContent}
        </View>
      )}
    </View>
  )
);

const CardAgent = React.forwardRef<View, CardAgentProps>(
  ({
    name,
    avatar,
    status = "offline",
    description,
    rating,
    specialties = [],
    onPress,
    animate = true,
    ...props
  }, ref) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (animate) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    }, [animate, fadeAnim]);

    const handlePressIn = () => {
      if (onPress) {
        Animated.timing(scaleAnim, {
          toValue: 0.97,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    };

    const handlePressOut = () => {
      if (onPress) {
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }
    };

    const getStatusColor = () => {
      switch (status) {
        case 'online': return 'text-brand-green';
        case 'away': return 'text-brand-warning';
        case 'busy': return 'text-brand-red';
        default: return 'text-light-text-secondary';
      }
    };

    const renderStars = () => {
      if (!rating) return null;
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <Ionicons
            key={i}
            name={i <= rating ? "star" : "star-outline"}
            size={14}
          />
        );
      }
      return <View className="flex-row">{stars}</View>;
    };

    const AgentCard = (
      <Animated.View
        ref={ref}
        style={{
          opacity: animate ? fadeAnim : 1,
          transform: [{ scale: scaleAnim }],
        }}
        className="bg-light-secondary rounded-lg p-md"
        {...props}
      >
        <View className="flex-row items-start space-x-md">
          <View className="relative">
            <Image
              source={avatar}
              className="w-16 h-16 rounded-full"
              resizeMode="cover"
            />
            <View className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-light-secondary ${
              status === 'online' ? 'bg-brand-green' :
              status === 'away' ? 'bg-brand-warning' :
              status === 'busy' ? 'bg-brand-red' : 'bg-light-border'
            }`} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-light-text">
                {name}
              </Text>
              {rating && renderStars()}
            </View>

            <Text className={`text-sm capitalize ${getStatusColor()}`}>
              {status}
            </Text>

            {description && (
              <Text className="text-sm text-light-text-secondary mt-xs">
                {description}
              </Text>
            )}

            {specialties.length > 0 && (
              <View className="flex-row flex-wrap gap-xs mt-sm">
                {specialties.slice(0, 3).map((specialty, index) => (
                  <View
                    key={index}
                    className="bg-brand-purple/20 px-xs py-1 rounded-full"
                  >
                    <Text className="text-xs text-brand-black font-medium">
                      {specialty}
                    </Text>
                  </View>
                ))}
                {specialties.length > 3 && (
                  <View className="bg-light-border/20/20 px-xs py-1 rounded-full">
                    <Text className="text-xs text-light-text-secondary">
                      +{specialties.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {onPress && (
            <TouchableOpacity className="p-xs">
              <Ionicons
                name="chevron-forward"
                size={20}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );

    if (onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {AgentCard}
        </TouchableOpacity>
      );
    }

    return AgentCard;
  }
);

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardTitle.displayName = "CardTitle";
CardDescription.displayName = "CardDescription";
CardContent.displayName = "CardContent";
CardFooter.displayName = "CardFooter";
CardImage.displayName = "CardImage";
CardAgent.displayName = "CardAgent";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardImage,
  CardAgent,
};
