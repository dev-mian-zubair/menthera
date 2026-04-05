import React from 'react';
import { View, Text } from 'react-native';
import { cva } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border",
  {
    variants: {
      variant: {
        default: "bg-brand-black border-transparent",
        secondary: "bg-light-tertiary border-transparent",
        destructive: "bg-brand-error border-transparent",
        success: "bg-brand-success border-transparent",
        purple: "bg-brand-purple border-transparent",
        outline: "bg-transparent border-light-border",
        ghost: "bg-light-secondary border-transparent",
      },
      size: {
        default: "px-sm py-xs",
        sm: "px-xs py-0.5",
        lg: "px-md py-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const badgeTextVariants = cva(
  "font-medium text-center",
  {
    variants: {
      variant: {
        default: "text-white",
        secondary: "text-light-text",
        destructive: "text-light-text",
        success: "text-light-text",
        purple: "text-white",
        outline: "text-light-text",
        ghost: "text-light-text",
      },
      size: {
        default: "text-xs",
        sm: "text-xs",
        lg: "text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "success" | "purple" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, textClassName, variant = "default", size = "default", children, ...props }, ref) => (
    <View
      ref={ref}
      className={badgeVariants({ variant, size, className })}
      {...props}
    >
      <Text className={badgeTextVariants({ variant, size, className: textClassName })}>
        {children}
      </Text>
    </View>
  )
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
