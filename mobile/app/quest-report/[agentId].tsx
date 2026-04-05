/**
 * Quest Report Screen - Display personalized insights from completed quest
 * Route: /quest-report/{agentId}
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { questsApi, QuestReport } from '@/lib/api';
import { tokens } from '@/lib/styles/core/tokens';
import { Colors } from '@/constants/Theme';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { RoughSeparator } from '@/components/ui/RoughSeparator';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

type ReportStep = 'intro' | 'section' | 'complete';

export default function QuestReportScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);

  const [report, setReport] = useState<QuestReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ReportStep>('intro');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    if (!agentId) {
      Alert.alert('Error', 'Agent ID is required');
      router.back();
      return;
    }

    loadReport();
  }, [agentId]);

  const loadReport = async () => {
    if (!agentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await questsApi.getQuestReport(agentId);

      if (!response.success || !response.data) {
        throw new Error('Failed to load report');
      }

      setReport(response.data);
    } catch (err) {
      logger.error('[QuestReportScreen] Error loading report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
      Alert.alert('Error', 'Failed to load your insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadReport();
  };

  const handleDone = () => {
    router.back();
  };

  const handleNext = () => {
    if (!report?.reportData) return;

    const totalSections = report.reportData.sections.length;

    if (currentStep === 'intro') {
      setCurrentStep('section');
      setCurrentSectionIndex(0);
    } else if (currentStep === 'section') {
      if (currentSectionIndex < totalSections - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
      } else {
        setCurrentStep('complete');
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'section') {
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex(currentSectionIndex - 1);
      } else {
        setCurrentStep('intro');
      }
    } else if (currentStep === 'complete') {
      const totalSections = report?.reportData?.sections.length || 0;
      if (totalSections > 0) {
        setCurrentStep('section');
        setCurrentSectionIndex(totalSections - 1);
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !report) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.questReport.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorTitle, { color: theme.questReport.text }]}>Unable to Load Insights</Text>
        <Text style={[styles.errorText, { color: theme.questReport.textSecondary }]}>
          {error || 'Something went wrong while loading your insights'}
        </Text>
        <Button variant="primary" onPress={handleRetry} backgroundColor={theme.questReport.primaryButtonBackground} textColor={theme.questReport.primaryButtonText}>
          Try Again
        </Button>
      </View>
    );
  }

  // Check if report data is ready
  if (!report.reportReady || !report.reportData) {
    return (
      <View style={[styles.processingContainer, { backgroundColor: theme.questReport.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
        <View style={styles.processingIconContainer}>
          <ActivityIndicator size="large" color={theme.questReport.processingSpinner} />
        </View>
        <Text style={[styles.processingTitle, { color: theme.questReport.text }]}>Generating Your Insights</Text>
        <Text style={[styles.processingText, { color: theme.questReport.textSecondary }]}>
          Our AI is analyzing your responses to create personalized insights. This usually takes a few moments.
        </Text>
        <Text style={[styles.processingSubtext, { color: theme.questReport.textSecondary }]}>
          You can come back to view your report later!
        </Text>
        <Button variant="outline" onPress={handleDone} backgroundColor={theme.questReport.outlineButtonBackground} textColor={theme.questReport.outlineButtonText} borderColor={theme.questReport.outlineButtonBorder}>
          Close
        </Button>
      </View>
    );
  }

  const { reportData } = report;

  // Sort sections by order
  const sections = [...reportData.sections].sort((a, b) => a.order - b.order);

  const renderIntro = () => (
    <View style={[styles.container, { backgroundColor: theme.questReport.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.introScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={[styles.reportTitle, { color: theme.questReport.text }]}>{reportData.title}</Text>
          <Text style={[styles.reportDescription, { color: theme.questReport.textSecondary }]}>{reportData.description}</Text>

          {/* Compact Stats Row */}
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: theme.questReport.text }]}>
              {sections.length} sections · {sections.reduce((acc, s) => acc + s.subsections.length, 0)} insights
            </Text>
          </View>
        </View>

        {/* Sections List */}
        <View style={styles.sectionsContainer}>
          <Text style={[styles.sectionsHeader, { color: theme.questReport.text }]}>Inside Your Report</Text>

          <View style={styles.sectionsList}>
            {sections.map((section) => (
              <View key={section.id} style={[styles.sectionItem, { backgroundColor: theme.questReport.sectionItemBackground }]}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <View style={styles.sectionContent}>
                  <Text style={[styles.sectionTitle, { color: theme.questReport.text }]}>{section.title}</Text>
                  <Text style={[styles.sectionSummary, { color: theme.questReport.textSecondary }]}>{section.summary}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: theme.questReport.infoNoteBackground }]}>
          <Text style={styles.infoIcon}>✨</Text>
          <Text style={[styles.infoText, { color: theme.questReport.infoNoteText }]}>
            Personalized insights based on your quest responses
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={[styles.footer, { backgroundColor: theme.questReport.footerBackground, paddingBottom: insets.bottom + tokens.spacing.md }]}>
        <Button variant="primary" size="lg" onPress={handleNext} fullWidth backgroundColor={theme.questReport.primaryButtonBackground} textColor={theme.questReport.primaryButtonText}>
          Start Reading
        </Button>
      </View>
    </View>
  );

  const renderSection = () => {
    const section = sections[currentSectionIndex];
    if (!section) return null;

    const isLastSection = currentSectionIndex === sections.length - 1;

    // Dynamic markdown styles based on theme
    const themedMarkdownStyles = {
      ...markdownStyles,
      body: { ...markdownStyles.body, color: theme.questReport.markdownText },
      heading1: { ...markdownStyles.heading1, color: theme.questReport.markdownHeading },
      heading2: { ...markdownStyles.heading2, color: theme.questReport.markdownHeading },
      heading3: { ...markdownStyles.heading3, color: theme.questReport.markdownHeading },
      paragraph: { ...markdownStyles.paragraph, color: theme.questReport.markdownText },
      list_item: { ...markdownStyles.list_item, color: theme.questReport.markdownText },
      code_inline: { ...markdownStyles.code_inline, backgroundColor: theme.questReport.markdownCodeBackground },
      fence: { ...markdownStyles.fence, backgroundColor: theme.questReport.markdownCodeBackground },
      blockquote: { ...markdownStyles.blockquote, backgroundColor: theme.questReport.markdownBlockquoteBackground, borderLeftColor: theme.questReport.markdownBlockquoteBorder },
    };

    return (
      <View style={[styles.container, { backgroundColor: theme.questReport.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.sectionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepHeader}>
            <Text style={styles.sectionIconLarge}>{section.icon}</Text>
            <Text style={[styles.stepTitle, { color: theme.questReport.text }]}>{section.title}</Text>
          </View>

          {/* Section summary */}
          {section.summary && (
            <Text style={[styles.sectionSummaryText, { color: theme.questReport.textSecondary }]}>{section.summary}</Text>
          )}

          {/* Subsections */}
          {section.subsections.map((subsection, index) => (
            <React.Fragment key={index}>
              <View style={styles.subsectionCard}>
                <Text style={[styles.subsectionTitle, { color: theme.questReport.text }]}>{subsection.title}</Text>
                <Markdown style={themedMarkdownStyles}>
                  {subsection.content}
                </Markdown>
              </View>
              {index < section.subsections.length - 1 && (
                <RoughSeparator marginVertical={24} color={theme.questReport.separatorColor} />
              )}
            </React.Fragment>
          ))}
        </ScrollView>

        <View style={[styles.bottomAction, { backgroundColor: theme.questReport.footerBackground, borderTopColor: theme.questReport.footerBorder, paddingBottom: insets.bottom + tokens.spacing.md }]}>
          <View style={styles.navigationButtons}>
            <View style={styles.backButton}>
              <Button
                variant="outline"
                size="lg"
                onPress={handleBack}
                fullWidth
                backgroundColor={theme.questReport.outlineButtonBackground}
                textColor={theme.questReport.outlineButtonText}
                borderColor={theme.questReport.outlineButtonBorder}
              >
                Back
              </Button>
            </View>
            <View style={styles.nextButton}>
              <Button
                variant="primary"
                size="lg"
                onPress={handleNext}
                fullWidth
                backgroundColor={theme.questReport.primaryButtonBackground}
                textColor={theme.questReport.primaryButtonText}
              >
                {isLastSection ? 'Finish' : 'Next'}
              </Button>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderComplete = () => (
    <View style={[styles.container, { backgroundColor: theme.questReport.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
      <View style={styles.centeredContent}>
        <View style={styles.completeContent}>
          <Text style={styles.completeIcon}>🎉</Text>
          <Text style={[styles.completeTitle, { color: theme.questReport.text }]}>Report Complete!</Text>
          <Text style={[styles.completeText, { color: theme.questReport.textSecondary }]}>
            You've reviewed all your personalized insights. You can always come back to review them again.
          </Text>

          {reportData.generatedAt && (
            <Text style={[styles.metadataText, { color: theme.questReport.textSecondary }]}>
              Report generated on {new Date(reportData.generatedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.bottomAction, { backgroundColor: theme.questReport.footerBackground, borderTopColor: theme.questReport.footerBorder, paddingBottom: insets.bottom + tokens.spacing.md }]}>
        <Button variant="primary" size="lg" onPress={handleDone} fullWidth backgroundColor={theme.questReport.primaryButtonBackground} textColor={theme.questReport.primaryButtonText}>
          Continue Chat
        </Button>
      </View>
    </View>
  );

  // Render current step
  if (currentStep === 'intro') return renderIntro();
  if (currentStep === 'section') return renderSection();
  if (currentStep === 'complete') return renderComplete();

  // Fallback
  return renderIntro();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.md,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xl,
  },
  sectionScrollContent: {
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: tokens.spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'SFProDisplayBold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },
  cardText: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    lineHeight: 24,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: tokens.spacing.md,
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.brand.goldenGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
    flexShrink: 0,
  },
  recommendationNumberText: {
    fontSize: 14,
    fontFamily: 'SFProDisplayBold',
    color: '#FFFFFF',
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    lineHeight: 24,
  },
  metadata: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.lg,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomAction: {
    padding: tokens.spacing.md,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: Colors.light.background,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: tokens.spacing.md,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'SFProDisplayBold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: tokens.spacing.xl,
    lineHeight: 22,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: Colors.light.background,
  },
  processingIconContainer: {
    marginBottom: tokens.spacing.md,
  },
  processingTitle: {
    fontSize: 24,
    fontFamily: 'SFProDisplayBold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  processingText: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: tokens.spacing.sm,
    lineHeight: 22,
  },
  processingSubtext: {
    fontSize: 13,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: tokens.spacing.xl,
  },
  introScrollContent: {
    flexGrow: 1,
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.md,
  },
  overviewCard: {
    marginBottom: tokens.spacing.md,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'SFProDisplaySemibold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  reportDescription: {
    fontSize: 14,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: 14,
    fontFamily: 'SFProDisplaySemibold',
    color: Colors.light.text,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  sectionsContainer: {
    marginBottom: tokens.spacing.lg,
  },
  sectionsHeader: {
    fontSize: 16,
    fontFamily: 'SFProDisplaySemibold',
    color: Colors.light.text,
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  sectionsList: {
    gap: 12,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  sectionIconLarge: {
    fontSize: 48,
    marginBottom: tokens.spacing.sm,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'SFProDisplaySemibold',
    color: Colors.light.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSummary: {
    fontSize: 12,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    opacity: 0.7,
    lineHeight: 16,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'SFProDisplayMedium',
    color: Colors.light.text,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    backgroundColor: Colors.light.background,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  stepNumber: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: Colors.light.text,
    opacity: 0.6,
    marginBottom: tokens.spacing.xs,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'SFProDisplayBold',
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
  },
  sectionSummaryText: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    opacity: 0.8,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.sm,
  },
  subsectionCard: {
    marginBottom: tokens.spacing.lg,
  },
  subsectionTitle: {
    fontSize: 18,
    fontFamily: 'SFProDisplaySemibold',
    color: Colors.light.text,
    marginBottom: tokens.spacing.md,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  completeContent: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: tokens.spacing.md,
  },
  completeTitle: {
    fontSize: 28,
    fontFamily: 'SFProDisplayBold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  completeText: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: tokens.spacing.xl,
  },
});

// Markdown styles
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  heading1: {
    fontSize: 24,
    fontFamily: 'SFProDisplayBold',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
    lineHeight: 32,
    textAlign: 'center',
  },
  heading2: {
    fontSize: 20,
    fontFamily: 'SFProDisplayBold',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 10,
    lineHeight: 28,
    textAlign: 'center',
  },
  heading3: {
    fontSize: 17,
    fontFamily: 'SFProDisplaySemibold',
    color: Colors.light.text,
    marginTop: 14,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  strong: {
    fontFamily: 'SFProDisplaySemibold',
    fontWeight: '600',
  },
  em: {
    fontFamily: 'SFProDisplayRegular',
    fontStyle: 'italic',
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  list_item: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 6,
  },
  code_inline: {
    fontFamily: 'Courier',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
  },
  fence: {
    fontFamily: 'Courier',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.brand.charcoal,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
});
