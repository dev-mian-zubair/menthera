/**
 * CloudWatch Alarms for Call Service
 * Monitors critical failures and sends SNS notifications
 */

import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Duration } from 'aws-cdk-lib';

export interface CallAlarmsProps {
  environment: string;
  createCallFunction: lambda.IFunction;
  callProcessorFunction: lambda.IFunction;
  callEventsDLQ: sqs.IQueue;
  // ⚡ WARM POOL RESOURCES (optional - will skip warm pool alarms if not provided)
  botAssignmentsQueue?: sqs.IQueue;
  botAssignmentsDLQ?: sqs.IQueue;
  warmPoolService?: ecs.IBaseService;
  alarmEmail?: string; // Optional email for alarm notifications
}

export class CallAlarms extends Construct {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: CallAlarmsProps) {
    super(scope, id);

    const {
      environment,
      createCallFunction,
      callProcessorFunction,
      callEventsDLQ,
      botAssignmentsQueue,
      botAssignmentsDLQ,
      warmPoolService,
      alarmEmail
    } = props;

    // ===== SNS TOPIC FOR ALARMS =====
    this.alarmTopic = new sns.Topic(this, 'CallAlarmTopic', {
      displayName: `Menthera Call Service Alarms - ${environment}`,
      topicName: `menthera-call-alarms-${environment}`,
    });

    // Subscribe email if provided
    if (alarmEmail) {
      this.alarmTopic.addSubscription(new subscriptions.EmailSubscription(alarmEmail));
    }

    // ===== 1. LAMBDA ERROR RATE ALARM =====
    // Triggers when Lambda error rate exceeds threshold

    // Create Call Handler errors
    const createCallErrors = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: createCallFunction.functionName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: Duration.minutes(5),
    });

    const createCallInvocations = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: {
        FunctionName: createCallFunction.functionName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: Duration.minutes(5),
    });

    const createCallErrorRate = new cloudwatch.MathExpression({
      expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
      usingMetrics: {
        errors: createCallErrors,
        invocations: createCallInvocations,
      },
      period: Duration.minutes(5),
      label: 'Create Call Error Rate (%)',
    });

    const createCallAlarm = new cloudwatch.Alarm(this, 'CreateCallErrorRateAlarm', {
      alarmName: `${environment}-CreateCall-HighErrorRate`,
      alarmDescription: 'Create call handler has high error rate (>10% over 5 minutes)',
      metric: createCallErrorRate,
      threshold: 10, // 10% error rate
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    createCallAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // Call Processor errors
    const processorErrors = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: callProcessorFunction.functionName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: Duration.minutes(5),
    });

    const processorInvocations = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: {
        FunctionName: callProcessorFunction.functionName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: Duration.minutes(5),
    });

    const processorErrorRate = new cloudwatch.MathExpression({
      expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
      usingMetrics: {
        errors: processorErrors,
        invocations: processorInvocations,
      },
      period: Duration.minutes(5),
      label: 'Call Processor Error Rate (%)',
    });

    const processorAlarm = new cloudwatch.Alarm(this, 'CallProcessorErrorRateAlarm', {
      alarmName: `${environment}-CallProcessor-HighErrorRate`,
      alarmDescription: 'Call processor has high error rate (>10% over 5 minutes)',
      metric: processorErrorRate,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    processorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // ===== 2. ECS TASK FAILURE ALARM =====
    // Triggers when ECS tasks fail to start

    const ecsTaskFailed = new cloudwatch.Metric({
      namespace: 'Menthera/CallService',
      metricName: 'EcsTaskFailed',
      dimensionsMap: {
        Environment: environment,
      },
      statistic: cloudwatch.Stats.SUM,
      period: Duration.minutes(5),
    });

    const ecsFailureAlarm = new cloudwatch.Alarm(this, 'EcsTaskFailureAlarm', {
      alarmName: `${environment}-EcsTask-HighFailureRate`,
      alarmDescription: 'ECS tasks failing to start (>3 failures in 5 minutes)',
      metric: ecsTaskFailed,
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    ecsFailureAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // ===== 3. DEAD LETTER QUEUE ALARM =====
    // Triggers when messages appear in DLQ (failed call processing)

    const dlqMessages = new cloudwatch.Metric({
      namespace: 'AWS/SQS',
      metricName: 'ApproximateNumberOfMessagesVisible',
      dimensionsMap: {
        QueueName: callEventsDLQ.queueName,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: Duration.minutes(5),
    });

    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `${environment}-CallEvents-DLQMessages`,
      alarmDescription: 'Call events failing to process (messages in DLQ)',
      metric: dlqMessages,
      threshold: 1, // Alert on ANY message in DLQ
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // ===== COMPOSITE ALARM (Optional) =====
    // Triggers when any critical alarm fires
    new cloudwatch.CompositeAlarm(this, 'CallServiceCriticalAlarm', {
      alarmDescription: 'One or more critical call service alarms triggered',
      compositeAlarmName: `${environment}-CallService-CriticalFailure`,
      alarmRule: cloudwatch.AlarmRule.anyOf(
        cloudwatch.AlarmRule.fromAlarm(createCallAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.fromAlarm(processorAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.fromAlarm(ecsFailureAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.fromAlarm(dlqAlarm, cloudwatch.AlarmState.ALARM)
      ),
    });

    // ===== BONUS: CALL FAILURE METRIC ALARM =====
    // Track call failures from custom metrics
    const callFailures = new cloudwatch.Metric({
      namespace: 'Menthera/CallService',
      metricName: 'CallFailure',
      dimensionsMap: {
        Environment: environment,
      },
      statistic: cloudwatch.Stats.SUM,
      period: Duration.minutes(5),
    });

    const callFailureAlarm = new cloudwatch.Alarm(this, 'CallFailureAlarm', {
      alarmName: `${environment}-Call-HighFailureRate`,
      alarmDescription: 'High rate of call failures (>5 failures in 5 minutes)',
      metric: callFailures,
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    callFailureAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // ===== ⚡ WARM POOL ALARMS =====
    // Only create these if warm pool resources are provided
    if (botAssignmentsQueue && botAssignmentsDLQ && warmPoolService) {
      // ===== 1. BOT ASSIGNMENTS DLQ ALARM =====
      // Triggers when bot assignments fail and go to DLQ
      const botAssignmentsDlqMessages = new cloudwatch.Metric({
        namespace: 'AWS/SQS',
        metricName: 'ApproximateNumberOfMessagesVisible',
        dimensionsMap: {
          QueueName: botAssignmentsDLQ.queueName,
        },
        statistic: cloudwatch.Stats.AVERAGE,
        period: Duration.minutes(5),
      });

      const botDlqAlarm = new cloudwatch.Alarm(this, 'BotAssignmentsDLQAlarm', {
        alarmName: `${environment}-BotAssignments-DLQMessages`,
        alarmDescription: 'Bot assignments failing to process (messages in DLQ)',
        metric: botAssignmentsDlqMessages,
        threshold: 1, // Alert on ANY message in DLQ
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      botDlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      // ===== 2. HIGH QUEUE DEPTH ALARM =====
      // Triggers when assignments queue has too many waiting messages (warm pool not keeping up)
      const queueDepth = new cloudwatch.Metric({
        namespace: 'AWS/SQS',
        metricName: 'ApproximateNumberOfMessagesVisible',
        dimensionsMap: {
          QueueName: botAssignmentsQueue.queueName,
        },
        statistic: cloudwatch.Stats.AVERAGE,
        period: Duration.minutes(5),
      });

      const queueDepthAlarm = new cloudwatch.Alarm(this, 'BotAssignmentsQueueDepthAlarm', {
        alarmName: `${environment}-BotAssignments-HighQueueDepth`,
        alarmDescription: 'Bot assignments queue depth too high - warm pool not keeping up (>10 messages)',
        metric: queueDepth,
        threshold: 10, // Alert if 10+ assignments waiting
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      queueDepthAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      // ===== 3. OLD MESSAGES ALARM =====
      // Triggers when messages are waiting too long in queue
      const messageAge = new cloudwatch.Metric({
        namespace: 'AWS/SQS',
        metricName: 'ApproximateAgeOfOldestMessage',
        dimensionsMap: {
          QueueName: botAssignmentsQueue.queueName,
        },
        statistic: cloudwatch.Stats.MAXIMUM,
        period: Duration.minutes(5),
      });

      const messageAgeAlarm = new cloudwatch.Alarm(this, 'BotAssignmentsMessageAgeAlarm', {
        alarmName: `${environment}-BotAssignments-OldMessages`,
        alarmDescription: 'Bot assignments waiting too long in queue (>2 minutes)',
        metric: messageAge,
        threshold: 120, // 2 minutes in seconds
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      messageAgeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      // ===== 4. WARM POOL ASSIGNMENT SUCCESS RATE =====
      // Track bot assignment send success/failure
      const botAssignmentsSent = new cloudwatch.Metric({
        namespace: 'Menthera/CallService',
        metricName: 'BotAssignmentSent',
        dimensionsMap: {
          Environment: environment,
        },
        statistic: cloudwatch.Stats.SUM,
        period: Duration.minutes(5),
      });

      const botAssignmentsFailed = new cloudwatch.Metric({
        namespace: 'Menthera/CallService',
        metricName: 'BotAssignmentFailed',
        dimensionsMap: {
          Environment: environment,
        },
        statistic: cloudwatch.Stats.SUM,
        period: Duration.minutes(5),
      });

      const botAssignmentFailureRate = new cloudwatch.MathExpression({
        expression: 'IF(sent > 0, (failed / sent) * 100, 0)',
        usingMetrics: {
          sent: botAssignmentsSent,
          failed: botAssignmentsFailed,
        },
        period: Duration.minutes(5),
        label: 'Bot Assignment Failure Rate (%)',
      });

      const botAssignmentAlarm = new cloudwatch.Alarm(this, 'BotAssignmentFailureRateAlarm', {
        alarmName: `${environment}-BotAssignment-HighFailureRate`,
        alarmDescription: 'High rate of bot assignment failures (>20% over 5 minutes)',
        metric: botAssignmentFailureRate,
        threshold: 20, // 20% failure rate
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      botAssignmentAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      // ===== 5. WARM POOL SERVICE RUNNING TASKS =====
      // Alert if service has no running tasks (warm pool is down)
      const runningTasksMetric = new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'RunningTaskCount',
        dimensionsMap: {
          ServiceName: warmPoolService.serviceName,
          ClusterName: warmPoolService.cluster.clusterName,
        },
        statistic: cloudwatch.Stats.AVERAGE,
        period: Duration.minutes(5),
      });

      const noRunningTasksAlarm = new cloudwatch.Alarm(this, 'WarmPoolNoTasksAlarm', {
        alarmName: `${environment}-WarmPool-NoRunningTasks`,
        alarmDescription: 'Warm pool has no running tasks - service may be down',
        metric: runningTasksMetric,
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING, // Treat missing data as alarm
      });

      noRunningTasksAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    }
  }
}
