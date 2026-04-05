/**
 * Quest Screen - Agent-specific quest/assessment with task-based flow
 * Route: /quest/{agentId}
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Alert, StatusBar, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuest } from '@/providers/QuestProvider';
import { useAgentPreferencesContext } from '@/providers/AgentPreferencesProvider';
import {
  QuestContainer,
  QuestIntro,
  QuestQuestion,
  QuestCompletion,
} from '@/components/quest';
import { QuestTaskIntro } from '@/components/quest/QuestTaskIntro';
import { QuestTaskReview } from '@/components/quest/QuestTaskReview';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';
import { useApiKeyGate } from '@/hooks/useApiKeyGate';
import { ApiKeyPrompt } from '@/components/modals/ApiKeyPrompt';

type QuestStep =
  | 'intro' // Quest intro (overall)
  | 'task_intro' // Task intro
  | 'questions' // Answering questions
  | 'task_review' // Review task answers
  | 'completion'; // Quest complete

export default function QuestScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const { selectAgent } = useAgentPreferencesContext();
  const theme = useMemo(() => getTimeTheme(), []);
  const {
    questState,
    isLoading,
    error,
    checkQuestStatus,
    loadQuestPreview,
    startQuest,
    saveAnswer,
    submitTask,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    getCurrentTask,
    getCurrentQuestion,
    isLastQuestionInTask,
    isFirstQuestionInTask,
    getTaskProgress,
    getQuestionProgress,
  } = useQuest();

  const { showPrompt, requireApiKey, dismissPrompt, onKeyStored } = useApiKeyGate();

  const [currentStep, setCurrentStep] = useState<QuestStep>('intro');
  const [questStatus, setQuestStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

  useEffect(() => {
    if (!agentId) {
      Alert.alert('Error', 'Agent ID is required');
      router.back();
      return;
    }

    // Check quest status on mount
    loadQuestData();
  }, [agentId]);

  const loadQuestData = async () => {
    if (!agentId) return;

    try {
      // checkQuestStatus internally calls GET /quests/{agentId}
      // which already returns quest metadata + tasks preview + session info
      const status = await checkQuestStatus(agentId);
      setQuestStatus(status);

      if (status === 'completed') {
        setCurrentStep('completion');
      } else {
        // Show intro screen for both 'not_started' and 'in_progress'
        // We already have all the data we need from checkQuestStatus
        setCurrentStep('intro');
      }
    } catch (err) {
      logger.error('[QuestScreen] Error loading quest:', err);
      Alert.alert('Error', 'Failed to load quest. Please try again.');
    }
  };

  const handleStartQuest = async () => {
    if (!agentId) return;

    requireApiKey(async () => {
      try {
        const status = await checkQuestStatus(agentId);
        await startQuest(agentId);

        // If resuming, determine where to go based on progress
        if (status === 'in_progress') {
          const currentTask = getCurrentTask();
          if (currentTask && questState.taskAnswers.has(currentTask.taskId)) {
            // Has answers for current task - resume questions
            setCurrentStep('questions');
          } else {
            // No answers yet - show task intro
            setCurrentStep('task_intro');
          }
        } else {
          // New quest - start from task intro
          setCurrentStep('task_intro');
        }
      } catch (err) {
        logger.error('[QuestScreen] Error starting quest:', err);
        Alert.alert('Error', 'Failed to start quest. Please try again.');
      }
    });
  };

  const handleStartTask = () => {
    setCurrentStep('questions');
  };

  const handleAnswer = async (value: number) => {
    const question = getCurrentQuestion();
    if (!question) return;

    try {
      await saveAnswer(question.questionId, value);
    } catch (err) {
      logger.error('[QuestScreen] Error saving answer:', err);
      Alert.alert('Error', 'Failed to save answer. Please try again.');
    }
  };

  const handleNext = () => {
    if (isLastQuestionInTask()) {
      setCurrentStep('task_review');
    } else {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    if (isFirstQuestionInTask()) {
      return; // Can't go back from first question
    }
    previousQuestion();
  };

  const handleEditQuestion = (questionIndex: number) => {
    goToQuestion(questionIndex);
    setCurrentStep('questions');
  };

  const handleSubmitTask = async () => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;

    requireApiKey(async () => {
      try {
        const result = await submitTask(currentTask.taskId);

        if (result.isCompleted) {
          logger.debug('[QuestScreen] Quest complete - showing completion screen');
          setCurrentStep('completion');
        } else {
          logger.debug('[QuestScreen] Task submitted - showing next task intro');
          setCurrentStep('task_intro'); // Move to next task intro
        }
      } catch (err) {
        logger.error('[QuestScreen] Error submitting task:', err);
        Alert.alert('Error', 'Failed to submit task. Please try again.');
      }
    });
  };

  const handleContinueToChat = async () => {
    if (!agentId || !questState.sessionId) return;

    logger.debug('[QuestScreen] Continuing to chat with agent:', {
      agentId,
      sessionId: questState.sessionId,
    });

    // Select agent BEFORE navigating
    await selectAgent(agentId);

    // Navigate to chat with just welcome message (agent already selected globally)
    const chatPath = `/(tabs)/chat?welcomeMessage=${encodeURIComponent(`/quest-welcome:${questState.sessionId}`)}` as any;

    router.push(chatPath);
  };

  // Show error if exists
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Initial loading
  if (isLoading && !questState.questData) {
    return <LoadingScreen />;
  }

  // No quest data
  if (!questState.questData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingScreen />
      </View>
    );
  }

  const currentTask = getCurrentTask();
  const currentQuestion = getCurrentQuestion();
  const taskProgress = getTaskProgress();
  const questionProgress = getQuestionProgress();

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.quest.gradientColors[0] }]}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <QuestContainer
        showProgress={currentStep === 'questions'}
        currentQuestion={questionProgress.current}
        totalQuestions={questionProgress.total}
        disableScroll={true}
        theme={theme}
      >
      {currentStep === 'intro' && (
        <QuestIntro
          questDefinition={questState.questData.quest}
          tasks={questState.tasks}
          onStart={handleStartQuest}
          isLoading={isLoading}
          questStatus={questStatus}
          agentId={agentId}
          theme={theme}
        />
      )}

      {currentStep === 'task_intro' && currentTask && (
        <QuestTaskIntro
          task={currentTask}
          taskNumber={taskProgress.current}
          totalTasks={taskProgress.total}
          onStart={handleStartTask}
          isLoading={isLoading}
          theme={theme}
        />
      )}

      {currentStep === 'questions' && currentQuestion && currentTask && (
        <QuestQuestion
          question={currentQuestion}
          currentValue={questState.taskAnswers.get(currentTask.taskId)?.get(currentQuestion.questionId)}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onPrevious={isFirstQuestionInTask() ? undefined : handlePrevious}
          showNavigation
          isLastQuestion={isLastQuestionInTask()}
          disabled={isLoading}
          theme={theme}
        />
      )}

      {currentStep === 'task_review' && currentTask && (
        <QuestTaskReview
          task={currentTask}
          answers={questState.taskAnswers.get(currentTask.taskId) || new Map()}
          onEdit={handleEditQuestion}
          onSubmit={handleSubmitTask}
          isLoading={isLoading}
          theme={theme}
        />
      )}

      {currentStep === 'completion' && (
        <QuestCompletion
          onContinueToChat={handleContinueToChat}
          isLoading={isLoading}
          theme={theme}
        />
      )}
      </QuestContainer>

      <ApiKeyPrompt
        visible={showPrompt}
        onSuccess={onKeyStored}
        onDismiss={dismissPrompt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0F4FF', // Match gradient starting color
  },
});
