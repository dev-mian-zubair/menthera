import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface JourneyPathProps {
  steps: number;
  currentStep: number;
  completedSteps: number;
}

export const JourneyPath: React.FC<JourneyPathProps> = ({
  steps,
  currentStep,
  completedSteps,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: steps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = index < completedSteps;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <React.Fragment key={`step-${index}`}>
            {/* Node */}
            <View
              style={[
                styles.node,
                isCompleted && styles.nodeCompleted,
                isCurrent && styles.nodeCurrent,
                isUpcoming && styles.nodeUpcoming,
              ]}
            >
              {isCompleted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text
                  style={[
                    styles.nodeText,
                    isCurrent && styles.nodeTextCurrent,
                    isUpcoming && styles.nodeTextUpcoming,
                  ]}
                >
                  {stepNumber}
                </Text>
              )}
            </View>

            {/* Connector line (not on last step) */}
            {index < steps - 1 && (
              <View
                style={[
                  styles.connector,
                  isCompleted && styles.connectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  nodeCompleted: {
    backgroundColor: '#6ED7C4',
    borderColor: '#6ED7C4',
  },
  nodeCurrent: {
    backgroundColor: '#5A86FF',
    borderColor: '#5A86FF',
    transform: [{ scale: 1.1 }],
  },
  nodeUpcoming: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  nodeText: {
    fontSize: 15,
    fontFamily: 'SFProDisplayBold',
    color: '#9CA3AF',
  },
  nodeTextCurrent: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'SFProDisplayBold',
  },
  nodeTextUpcoming: {
    color: '#D1D5DB',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  connector: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 6,
    borderRadius: 2,
  },
  connectorCompleted: {
    backgroundColor: '#6ED7C4',
  },
});
