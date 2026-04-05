import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { logger } from '@/lib/utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} retry={this.retry} />;
      }

      // Default error UI
      return (
        <View className="flex-1 bg-light-primary justify-center items-center px-6">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="warning-outline" size={40} color={Colors.accent.error} />
            </View>
            <Text className="text-xl font-bold text-light-text mb-2 text-center">
              Something went wrong
            </Text>
            <Text className="text-light-text-secondary text-center mb-8">
              An unexpected error occurred. Please try again.
            </Text>
          </View>

          <TouchableOpacity
            onPress={this.retry}
            className="w-full max-w-xs bg-brand-purple rounded-lg px-6 py-3 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-brand-black font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}