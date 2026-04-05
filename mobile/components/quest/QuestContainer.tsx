import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@/lib/styles/core/tokens';
import { QuestProgress } from './QuestProgress';
import { TimeTheme } from '@/lib/utils/time-theme';

interface QuestContainerProps {
  children: React.ReactNode;
  showProgress?: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  disableScroll?: boolean; // For screens with custom scroll/fixed footer layouts
  theme?: TimeTheme;
}

export const QuestContainer: React.FC<QuestContainerProps> = ({
  children,
  showProgress = false,
  currentQuestion,
  totalQuestions,
  disableScroll = false,
  theme,
}) => {
  // When disableScroll is true, don't apply top edge to allow full-screen backgrounds
  const safeAreaEdges = disableScroll ? ['left', 'right'] : ['top', 'left', 'right'];

  return (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges as any}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.container, disableScroll && styles.containerNoInsets]}>
          {/* Progress Bar */}
          {showProgress && currentQuestion && totalQuestions && (
            <QuestProgress
              current={currentQuestion}
              total={totalQuestions}
              theme={theme}
            />
          )}

          {/* Content */}
          {disableScroll ? (
            children
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: tokens.spacing.md,
    backgroundColor: 'transparent',
  },
  containerNoInsets: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
});
