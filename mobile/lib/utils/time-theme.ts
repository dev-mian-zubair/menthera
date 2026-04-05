/**
 * Time-based theme utility
 * Provides dynamic colors based on time of day
 */

export type TimeTheme = {
  text: string;
  emoji: string;
  subtitle: string;
  gradientColors: readonly [string, string, string];
  background: string;
  textColor: string;
  subtitleColor: string;
  userNameColor: string;
  isNightMode: boolean;
  sectionTitleColor: string;
  sectionLinkColor: string;
  // Glassmorphic card colors
  glass: {
    cardBackground: string;
    cardBorder: string;
    cardShadow: string;
  };
  // Floating decoration colors
  floating: {
    circle1: string;
    circle2: string;
    circle3: string;
  };
  // Hero section colors
  hero: {
    breathingOrb: string;
    greetingSize: number;
  };
  // Card theme colors
  card: {
    background: string;
    nameColor: string;
    descriptionColor: string;
    buttonBackground: string;
    buttonTextColor: string;
    buttonIconColor: string;
    lockBadgeBackground: string;
    lockIconColor: string;
  };
  // Quick action colors
  quickAction: {
    primaryBackground: string;
    primaryTextColor: string;
    primaryIconColor: string;
    secondaryBackground: string;
    secondaryTextColor: string;
    secondaryIconColor: string;
  };
  // Tab bar colors
  tabBar: {
    background: string;
    borderColor: string;
    activeTint: string;
    inactiveTint: string;
    activeBackground: string;
  };
  // Usage card colors
  usageCard: {
    background: string;
    planBadgeBackground: string;
    planBadgeText: string;
    labelColor: string;
    valueColor: string;
    dividerColor: string;
    iconColor: string;
    gaugeBackground: string;
    streakBackground: string;
    streakText: string;
    achievementCardBackground: string;
    achievementCardBorder: string;
    milestoneBackground: string;
    milestoneBorder: string;
  };
  // Achievements screen colors
  achievements: {
    background: string;
    headerTitle: string;
    backIcon: string;
    heroTitle: string;
    heroSubtitle: string;
    levelBadgeBackground: string;
    levelBadgeText: string;
    levelLabel: string;
    statValue: string;
    statLabel: string;
    sectionTitle: string;
    sectionCount: string;
    cardBackground: string;
    cardBorder: string;
    cardTitle: string;
    cardTitleLocked: string;
    tabBackground: string;
    tabBorder: string;
    tabText: string;
    tabActiveBackground: string;
    tabActiveText: string;
    progressRingBackground: string;
  };
  // Profile screen colors
  profile: {
    background: string;
    headerTitle: string;
    userCardBackground: string;
    userName: string;
    userEmail: string;
    sectionTitle: string;
    menuItemBackground: string;
    menuItemTitle: string;
    menuItemSubtitle: string;
    menuItemIconBackground: string;
    menuItemIconColor: string;
    chevronColor: string;
    dangerZoneBackground: string;
    dangerZoneWarning: string;
    dangerZoneButtonBackground: string;
    signOutBackground: string;
    signOutText: string;
    signOutIcon: string;
  };
  // Agent detail screen colors
  agentDetail: {
    background: string;
    headerTitle: string;
    backIcon: string;
    cardBackground: string;
    agentName: string;
    specialty: string;
    description: string;
    sectionTitle: string;
    chatButtonBackground: string;
    chatButtonText: string;
    notFoundText: string;
    notFoundLink: string;
  };
  // Report notification card colors
  reportCard: {
    background: string;
    title: string;
    description: string;
    timestamp: string;
    shadowColor: string;
  };
  // Chat screen colors
  chat: {
    background: string;
    headerBackground: string;
    headerTitle: string;
    headerSubtitle: string;
    headerIcon: string;
    agentBubble: string;
    agentText: string;
    agentTimestamp: string;
    inputBackground: string;
    inputBorder: string;
    inputText: string;
    inputPlaceholder: string;
    errorBackground: string;
    errorBorder: string;
    errorText: string;
    // Markdown colors for agent messages
    markdownHeading: string;
    markdownStrong: string;
    markdownCodeBackground: string;
    markdownCodeInlineBackground: string;
    markdownBlockquoteBackground: string;
    markdownLink: string;
    markdownHr: string;
  };
  // Modal colors (shared for all bottom sheet modals)
  modal: {
    background: string;
    handleBar: string;
    headerTitle: string;
    headerSubtitle: string;
    closeButtonBackground: string;
    closeButtonIcon: string;
    itemBackground: string;
    itemTitle: string;
    itemDescription: string;
    itemBorder: string;
    selectedBorder: string;
    checkboxSelected: string;
    checkboxUnselected: string;
    checkboxUnselectedBorder: string;
    lockIconColor: string;
    // SafeGuard specific
    featureTitle: string;
    featureDescription: string;
    infoCardBackground: string;
    infoCardBorder: string;
    infoCardText: string;
    infoCardIcon: string;
    // Usage limit specific
    usageSectionBackground: string;
    usageSectionBorder: string;
    usageLabel: string;
    usageValue: string;
    usageBarBackground: string;
    usageBarFill: string;
    usagePercent: string;
    benefitsTitle: string;
    benefitText: string;
    benefitIcon: string;
    upgradeButtonBackground: string;
    upgradeButtonBorder: string;
    upgradeButtonText: string;
    dismissButtonBackground: string;
    dismissButtonBorder: string;
    dismissButtonText: string;
  };
  // Quest screen colors
  quest: {
    // Background gradient
    gradientColors: readonly [string, string, string];
    // Floating decorative circles
    floatingCircle1: string;
    floatingCircle2: string;
    floatingCircle3: string;
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    // Card backgrounds
    cardBackground: string;
    cardBorder: string;
    // Badge colors
    badgeBackground: string;
    badgeText: string;
    // Progress bar
    progressBarBackground: string;
    progressBarFill: string;
    progressDot: string;
    progressDotActive: string;
    // Buttons
    backButtonBackground: string;
    backButtonBorder: string;
    backButtonIcon: string;
    // Task gradients (array of gradient color pairs for task badges)
    taskGradient1: readonly [string, string];
    taskGradient2: readonly [string, string];
    taskGradient3: readonly [string, string];
    // Buttons
    primaryButtonBackground: string;
    primaryButtonText: string;
    // Option cards
    optionCardBackground: string;
    optionCardBorder: string;
    optionSelectedGradient: readonly [string, string];
    optionSelectedBorder: string;
    optionCheckBackground: string;
    optionCheckIcon: string;
    optionUnselectedBorder: string;
    // Stats badges
    statBadgeBackground: string;
    statBadgeText: string;
    // Info notes
    infoNoteBackground: string;
    infoNoteBorder: string;
    infoNoteText: string;
    // Completion screen
    completionIconGradient: readonly [string, string];
    completionIconShadow: string;
    reportCardBackground: string;
    reportCardBorder: string;
    loadingDotColor: string;
    // Review screen
    celebrationBadgeGradient: readonly [string, string];
    answeredCardGradient: readonly [string, string];
    answeredCardBorder: string;
    questionNumberBadgeBackground: string;
    questionNumberBadgeText: string;
    answerPillBackground: string;
    answerPillText: string;
    emptyCardBackground: string;
    emptyCardBorder: string;
    emptyNumberBadgeBackground: string;
    emptyNumberBadgeText: string;
    emptyPillBackground: string;
    emptyPillBorder: string;
    emptyPillText: string;
    warningBannerBackground: string;
    warningBannerBorder: string;
    warningBannerText: string;
    warningBannerIcon: string;
  };
  // Quest Report screen colors
  questReport: {
    background: string;
    text: string;
    textSecondary: string;
    cardBackground: string;
    cardBorder: string;
    sectionItemBackground: string;
    infoNoteBackground: string;
    infoNoteText: string;
    subsectionCardBackground: string;
    separatorColor: string;
    footerBackground: string;
    footerBorder: string;
    processingSpinner: string;
    errorIcon: string;
    // Button colors
    primaryButtonBackground: string;
    primaryButtonText: string;
    outlineButtonBackground: string;
    outlineButtonText: string;
    outlineButtonBorder: string;
    // Markdown colors
    markdownText: string;
    markdownHeading: string;
    markdownCodeBackground: string;
    markdownBlockquoteBackground: string;
    markdownBlockquoteBorder: string;
  };
  // Calls screen colors (tab + active call)
  calls: {
    // Calls tab (history)
    background: string;
    headerTitle: string;
    emptyIconBackground: string;
    emptyIconBorder: string;
    emptyTitle: string;
    emptyMessage: string;
    ctaButtonBackground: string;
    ctaButtonBorder: string;
    ctaButtonText: string;
    refreshTint: string;
    loadingIndicator: string;
    // Active call screen
    callBackground: string;
    statusText: string;
    statusTextSubtle: string;
    durationText: string;
    quotaBackground: string;
    quotaBackgroundWarning: string;
    quotaText: string;
    quotaTextWarning: string;
    quotaIcon: string;
    quotaIconWarning: string;
    agentName: string;
    agentSpecialty: string;
    participantText: string;
    participantSubtext: string;
    controlsBackground: string;
    controlsHandleBar: string;
    buttonBackground: string;
    buttonIcon: string;
    muteActiveBackground: string;
    muteActiveIcon: string;
    endCallBackground: string;
    endCallIcon: string;
    errorIcon: string;
    errorTitle: string;
    errorMessage: string;
    retryButtonBackground: string;
    retryButtonText: string;
    backButtonBackground: string;
    backButtonText: string;
    notFoundBackground: string;
    notFoundText: string;
  };
};

/**
 * Always-dark theme for the active call screen, regardless of time of day.
 * This creates a meditative, immersive environment during voice coaching sessions.
 * The calls tab (history list) still uses the time-based theme.
 */
export type CallScreenTheme = {
  background: string;
  backgroundGradientEnd: string;
  statusText: string;
  statusTextSubtle: string;
  durationText: string;
  quotaBackground: string;
  quotaBackgroundWarning: string;
  quotaText: string;
  quotaTextWarning: string;
  quotaIcon: string;
  quotaIconWarning: string;
  agentName: string;
  agentSpecialty: string;
  participantText: string;
  participantSubtext: string;
  controlsBackground: string;
  controlsHandleBar: string;
  buttonBackground: string;
  buttonIcon: string;
  muteActiveBackground: string;
  muteActiveIcon: string;
  endCallBackground: string;
  endCallIcon: string;
  errorIcon: string;
  errorTitle: string;
  errorMessage: string;
  retryButtonBackground: string;
  retryButtonText: string;
  backButtonBackground: string;
  backButtonText: string;
  notFoundBackground: string;
  notFoundText: string;
  backIcon: string;
};

export const getCallTheme = (): CallScreenTheme => ({
  background: '#0D1B2A',
  backgroundGradientEnd: '#1B2838',
  statusText: '#94A3B8',
  statusTextSubtle: '#64748B',
  durationText: '#F1F5F9',
  quotaBackground: 'rgba(255, 255, 255, 0.08)',
  quotaBackgroundWarning: 'rgba(251, 191, 36, 0.15)',
  quotaText: '#94A3B8',
  quotaTextWarning: '#FCD34D',
  quotaIcon: '#94A3B8',
  quotaIconWarning: '#FCD34D',
  agentName: '#F1F5F9',
  agentSpecialty: '#94A3B8',
  participantText: '#94A3B8',
  participantSubtext: '#64748B',
  controlsBackground: 'rgba(13, 27, 42, 0.92)',
  controlsHandleBar: 'rgba(148, 163, 184, 0.3)',
  buttonBackground: 'rgba(255, 255, 255, 0.1)',
  buttonIcon: '#E2E8F0',
  muteActiveBackground: '#EF4444',
  muteActiveIcon: '#FFFFFF',
  endCallBackground: '#EF4444',
  endCallIcon: '#FFFFFF',
  errorIcon: '#F87171',
  errorTitle: '#F1F5F9',
  errorMessage: '#94A3B8',
  retryButtonBackground: '#F1F5F9',
  retryButtonText: '#0D1B2A',
  backButtonBackground: 'rgba(255, 255, 255, 0.1)',
  backButtonText: '#E2E8F0',
  notFoundBackground: '#0D1B2A',
  notFoundText: '#94A3B8',
  backIcon: '#E2E8F0',
});

export const getTimeTheme = (): TimeTheme => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    // Morning: Warm sunrise - soft peach to light cream
    return {
      text: 'Good morning',
      emoji: '☀️',
      subtitle: 'Start your day with a positive mindset',
      gradientColors: ['#FFF5EB', '#FFECD2', '#FCE8D5'] as const,
      background: '#FFF5EB',
      textColor: '#1F2937',
      subtitleColor: '#6B7280',
      userNameColor: '#EA580C', // Warm orange for morning
      isNightMode: false,
      sectionTitleColor: '#1F2937',
      sectionLinkColor: '#5A86FF',
      glass: {
        cardBackground: 'rgba(255, 255, 255, 0.92)',
        cardBorder: 'rgba(234, 88, 12, 0.10)',
        cardShadow: 'rgba(234, 88, 12, 0.08)',
      },
      floating: {
        circle1: 'rgba(249, 115, 22, 0.05)',
        circle2: 'rgba(110, 215, 196, 0.04)',
        circle3: 'rgba(255, 209, 102, 0.03)',
      },
      hero: {
        breathingOrb: 'rgba(249, 115, 22, 0.06)',
        greetingSize: 36,
      },
      card: {
        background: 'rgba(255, 255, 255, 0.95)',
        nameColor: '#1F2937',
        descriptionColor: '#6B7280',
        buttonBackground: 'rgba(255, 237, 213, 0.8)',
        buttonTextColor: '#92400E',
        buttonIconColor: '#B45309',
        lockBadgeBackground: '#FEF3C7',
        lockIconColor: '#92400E',
      },
      quickAction: {
        primaryBackground: '#F97316',
        primaryTextColor: '#FFFFFF',
        primaryIconColor: '#FFFFFF',
        secondaryBackground: 'rgba(255, 255, 255, 0.9)',
        secondaryTextColor: '#92400E',
        secondaryIconColor: '#F97316',
      },
      tabBar: {
        background: '#FFF5EB',
        borderColor: 'rgba(251, 191, 143, 0.4)',
        activeTint: '#F97316',
        inactiveTint: '#9CA3AF',
        activeBackground: 'rgba(249, 115, 22, 0.15)',
      },
      usageCard: {
        background: 'rgba(255, 255, 255, 0.85)',
        planBadgeBackground: 'rgba(249, 115, 22, 0.12)',
        planBadgeText: '#EA580C',
        labelColor: '#78716C',
        valueColor: '#292524',
        dividerColor: 'rgba(251, 191, 143, 0.3)',
        iconColor: '#F97316',
        gaugeBackground: '#F9FAFB',
        streakBackground: '#FEF3C7',
        streakText: '#B45309',
        achievementCardBackground: 'rgba(255, 255, 255, 0.9)',
        achievementCardBorder: '#FED7AA',
        milestoneBackground: '#FFFBEB',
        milestoneBorder: '#FCD34D',
      },
      achievements: {
        background: '#FFF5EB',
        headerTitle: '#292524',
        backIcon: '#57534E',
        heroTitle: '#292524',
        heroSubtitle: '#78716C',
        levelBadgeBackground: '#F97316',
        levelBadgeText: '#FFFFFF',
        levelLabel: '#78716C',
        statValue: '#292524',
        statLabel: '#A8A29E',
        sectionTitle: '#292524',
        sectionCount: '#A8A29E',
        cardBackground: 'rgba(255, 255, 255, 0.9)',
        cardBorder: '#FED7AA',
        cardTitle: '#44403C',
        cardTitleLocked: '#A8A29E',
        tabBackground: 'rgba(255, 255, 255, 0.8)',
        tabBorder: '#FDBA74',
        tabText: '#78716C',
        tabActiveBackground: '#F97316',
        tabActiveText: '#FFFFFF',
        progressRingBackground: '#FED7AA',
      },
      profile: {
        background: '#FFF5EB',
        headerTitle: '#292524',
        userCardBackground: 'rgba(255, 255, 255, 0.9)',
        userName: '#292524',
        userEmail: '#78716C',
        sectionTitle: '#292524',
        menuItemBackground: 'rgba(255, 255, 255, 0.9)',
        menuItemTitle: '#292524',
        menuItemSubtitle: '#78716C',
        menuItemIconBackground: '#FEF3C7',
        menuItemIconColor: '#B45309',
        chevronColor: '#A8A29E',
        dangerZoneBackground: '#FEF2F2',
        dangerZoneWarning: '#78716C',
        dangerZoneButtonBackground: 'rgba(255, 255, 255, 0.95)',
        signOutBackground: 'rgba(255, 255, 255, 0.9)',
        signOutText: '#78716C',
        signOutIcon: '#A8A29E',
      },
      agentDetail: {
        background: '#FFF5EB',
        headerTitle: '#292524',
        backIcon: '#57534E',
        cardBackground: 'rgba(255, 255, 255, 0.9)',
        agentName: '#292524',
        specialty: '#78716C',
        description: '#44403C',
        sectionTitle: '#292524',
        chatButtonBackground: 'rgba(255, 255, 255, 0.95)',
        chatButtonText: '#292524',
        notFoundText: '#78716C',
        notFoundLink: '#F97316',
      },
      reportCard: {
        background: 'rgba(255, 255, 255, 0.95)',
        title: '#292524',
        description: '#78716C',
        timestamp: '#A8A29E',
        shadowColor: '#000000',
      },
      chat: {
        background: '#FFF5EB',
        headerBackground: '#FFF5EB',
        headerTitle: '#292524',
        headerSubtitle: '#78716C',
        headerIcon: '#57534E',
        agentBubble: 'rgba(255, 255, 255, 0.95)',
        agentText: '#292524',
        agentTimestamp: '#A8A29E',
        inputBackground: 'rgba(255, 255, 255, 0.95)',
        inputBorder: '#D6D3D1',
        inputText: '#292524',
        inputPlaceholder: '#A8A29E',
        errorBackground: '#FEF2F2',
        errorBorder: '#FECACA',
        errorText: '#991B1B',
        // Markdown colors
        markdownHeading: '#292524',
        markdownStrong: '#292524',
        markdownCodeBackground: '#FEF3C7',
        markdownCodeInlineBackground: 'rgba(41, 37, 36, 0.08)',
        markdownBlockquoteBackground: '#FFFBEB',
        markdownLink: '#EA580C',
        markdownHr: 'rgba(41, 37, 36, 0.12)',
      },
      modal: {
        background: '#FFF5EB',
        handleBar: '#FDBA74',
        headerTitle: '#292524',
        headerSubtitle: '#78716C',
        closeButtonBackground: 'rgba(255, 255, 255, 0.95)',
        closeButtonIcon: '#292524',
        itemBackground: 'rgba(255, 255, 255, 0.95)',
        itemTitle: '#292524',
        itemDescription: '#78716C',
        itemBorder: '#E7E5E4',
        selectedBorder: '#F97316',
        checkboxSelected: '#F97316',
        checkboxUnselected: 'rgba(255, 255, 255, 0.95)',
        checkboxUnselectedBorder: '#D6D3D1',
        lockIconColor: '#78716C',
        featureTitle: '#292524',
        featureDescription: '#78716C',
        infoCardBackground: '#FEF3C7',
        infoCardBorder: '#FCD34D',
        infoCardText: '#92400E',
        infoCardIcon: '#F97316',
        usageSectionBackground: 'rgba(255, 255, 255, 0.95)',
        usageSectionBorder: '#E7E5E4',
        usageLabel: '#A8A29E',
        usageValue: '#EA580C',
        usageBarBackground: '#E7E5E4',
        usageBarFill: '#EA580C',
        usagePercent: '#A8A29E',
        benefitsTitle: '#292524',
        benefitText: '#292524',
        benefitIcon: '#F97316',
        upgradeButtonBackground: '#F97316',
        upgradeButtonBorder: '#EA580C',
        upgradeButtonText: '#FFFFFF',
        dismissButtonBackground: 'rgba(255, 255, 255, 0.95)',
        dismissButtonBorder: '#E7E5E4',
        dismissButtonText: '#292524',
      },
      quest: {
        gradientColors: ['#FFF5EB', '#FFFFFF', '#FEF3C7'] as const,
        floatingCircle1: 'rgba(249, 115, 22, 0.08)',
        floatingCircle2: 'rgba(110, 215, 196, 0.08)',
        floatingCircle3: 'rgba(255, 193, 7, 0.06)',
        text: '#292524',
        textSecondary: '#78716C',
        textMuted: '#A8A29E',
        cardBackground: 'rgba(255, 255, 255, 0.9)',
        cardBorder: 'rgba(0, 0, 0, 0.04)',
        badgeBackground: 'rgba(249, 115, 22, 0.1)',
        badgeText: '#EA580C',
        progressBarBackground: '#FFFFFF',
        progressBarFill: '#F97316',
        progressDot: '#E7E5E4',
        progressDotActive: '#F97316',
        backButtonBackground: 'rgba(255, 255, 255, 0.9)',
        backButtonBorder: 'rgba(0, 0, 0, 0.08)',
        backButtonIcon: '#292524',
        taskGradient1: ['#FED7AA', '#FDBA74'] as const,
        taskGradient2: ['#BFDBFE', '#DBEAFE'] as const,
        taskGradient3: ['#A7F3D0', '#D1FAE5'] as const,
        primaryButtonBackground: '#292524',
        primaryButtonText: '#FFFFFF',
        optionCardBackground: '#FFFFFF',
        optionCardBorder: 'rgba(0, 0, 0, 0.08)',
        optionSelectedGradient: ['#F97316', '#FB923C'] as const,
        optionSelectedBorder: '#F97316',
        optionCheckBackground: '#FFFFFF',
        optionCheckIcon: '#F97316',
        optionUnselectedBorder: '#D6D3D1',
        statBadgeBackground: '#FEF3C7',
        statBadgeText: '#92400E',
        infoNoteBackground: '#FEF3C7',
        infoNoteBorder: 'rgba(0, 0, 0, 0.05)',
        infoNoteText: '#78716C',
        completionIconGradient: ['#6ED7C4', '#5AC4B3'] as const,
        completionIconShadow: '#6ED7C4',
        reportCardBackground: 'rgba(255, 255, 255, 0.95)',
        reportCardBorder: 'rgba(0, 0, 0, 0.04)',
        loadingDotColor: '#F97316',
        celebrationBadgeGradient: ['#10B981', '#059669'] as const,
        answeredCardGradient: ['rgba(249, 115, 22, 0.12)', 'rgba(249, 115, 22, 0.06)'] as const,
        answeredCardBorder: 'rgba(249, 115, 22, 0.25)',
        questionNumberBadgeBackground: '#FFFFFF',
        questionNumberBadgeText: '#F97316',
        answerPillBackground: 'rgba(255, 255, 255, 0.9)',
        answerPillText: '#F97316',
        emptyCardBackground: '#FFFFFF',
        emptyCardBorder: 'rgba(209, 213, 219, 0.5)',
        emptyNumberBadgeBackground: '#FEF3C7',
        emptyNumberBadgeText: '#A8A29E',
        emptyPillBackground: '#FFFBEB',
        emptyPillBorder: '#FDE68A',
        emptyPillText: '#A8A29E',
        warningBannerBackground: 'rgba(251, 191, 36, 0.1)',
        warningBannerBorder: 'rgba(217, 119, 6, 0.2)',
        warningBannerText: '#D97706',
        warningBannerIcon: '#D97706',
      },
      questReport: {
        background: '#FFF5EB',
        text: '#292524',
        textSecondary: '#78716C',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        cardBorder: '#FED7AA',
        sectionItemBackground: 'rgba(255, 255, 255, 0.95)',
        infoNoteBackground: '#FEF3C7',
        infoNoteText: '#92400E',
        subsectionCardBackground: 'rgba(255, 255, 255, 0.9)',
        separatorColor: '#FDBA74',
        footerBackground: '#FFF5EB',
        footerBorder: '#FED7AA',
        processingSpinner: '#F97316',
        errorIcon: '#EA580C',
        primaryButtonBackground: '#292524',
        primaryButtonText: '#FFFFFF',
        outlineButtonBackground: 'rgba(255, 255, 255, 0.95)',
        outlineButtonText: '#292524',
        outlineButtonBorder: '#D6D3D1',
        markdownText: '#292524',
        markdownHeading: '#292524',
        markdownCodeBackground: '#FEF3C7',
        markdownBlockquoteBackground: '#FFFBEB',
        markdownBlockquoteBorder: '#F97316',
      },
      calls: {
        // Calls tab (history)
        background: '#FFF5EB',
        headerTitle: '#292524',
        emptyIconBackground: 'rgba(255, 255, 255, 0.95)',
        emptyIconBorder: '#FED7AA',
        emptyTitle: '#292524',
        emptyMessage: '#78716C',
        ctaButtonBackground: '#F97316',
        ctaButtonBorder: '#EA580C',
        ctaButtonText: '#FFFFFF',
        refreshTint: '#F97316',
        loadingIndicator: '#F97316',
        // Active call screen
        callBackground: '#FFF5EB',
        statusText: '#78716C',
        statusTextSubtle: '#A8A29E',
        durationText: '#292524',
        quotaBackground: 'rgba(255, 255, 255, 0.95)',
        quotaBackgroundWarning: '#FEF3C7',
        quotaText: '#78716C',
        quotaTextWarning: '#D97706',
        quotaIcon: '#78716C',
        quotaIconWarning: '#D97706',
        agentName: '#292524',
        agentSpecialty: '#78716C',
        participantText: '#78716C',
        participantSubtext: '#A8A29E',
        controlsBackground: 'rgba(255, 255, 255, 0.98)',
        controlsHandleBar: '#FDBA74',
        buttonBackground: '#FEF3C7',
        buttonIcon: '#292524',
        muteActiveBackground: '#F97316',
        muteActiveIcon: '#FFFFFF',
        endCallBackground: '#EF4444',
        endCallIcon: '#FFFFFF',
        errorIcon: '#EF4444',
        errorTitle: '#292524',
        errorMessage: '#78716C',
        retryButtonBackground: '#292524',
        retryButtonText: '#FFFFFF',
        backButtonBackground: '#FEF3C7',
        backButtonText: '#292524',
        notFoundBackground: '#FFF5EB',
        notFoundText: '#78716C',
      },
    };
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: Clear sky - soft blue to white
    return {
      text: 'Good afternoon',
      emoji: '🌤️',
      subtitle: 'Take a moment for yourself',
      gradientColors: ['#E8F4FD', '#F0F7FF', '#F8FBFF'] as const,
      background: '#E8F4FD',
      textColor: '#1F2937',
      subtitleColor: '#6B7280',
      userNameColor: '#0284C7', // Sky blue for afternoon
      isNightMode: false,
      sectionTitleColor: '#1F2937',
      sectionLinkColor: '#5A86FF',
      glass: {
        cardBackground: 'rgba(255, 255, 255, 0.75)',
        cardBorder: 'rgba(255, 255, 255, 0.35)',
        cardShadow: 'rgba(0, 0, 0, 0.06)',
      },
      floating: {
        circle1: 'rgba(14, 165, 233, 0.05)',
        circle2: 'rgba(110, 215, 196, 0.04)',
        circle3: 'rgba(56, 189, 248, 0.03)',
      },
      hero: {
        breathingOrb: 'rgba(14, 165, 233, 0.06)',
        greetingSize: 36,
      },
      card: {
        background: 'rgba(255, 255, 255, 0.9)',
        nameColor: '#1F2937',
        descriptionColor: '#6B7280',
        buttonBackground: 'rgba(224, 242, 254, 0.8)',
        buttonTextColor: '#0369A1',
        buttonIconColor: '#0284C7',
        lockBadgeBackground: '#E0F2FE',
        lockIconColor: '#0369A1',
      },
      quickAction: {
        primaryBackground: '#0EA5E9',
        primaryTextColor: '#FFFFFF',
        primaryIconColor: '#FFFFFF',
        secondaryBackground: 'rgba(255, 255, 255, 0.9)',
        secondaryTextColor: '#0369A1',
        secondaryIconColor: '#0EA5E9',
      },
      tabBar: {
        background: '#F0F7FF',
        borderColor: 'rgba(147, 197, 253, 0.4)',
        activeTint: '#0EA5E9',
        inactiveTint: '#9CA3AF',
        activeBackground: 'rgba(14, 165, 233, 0.15)',
      },
      usageCard: {
        background: 'rgba(255, 255, 255, 0.9)',
        planBadgeBackground: 'rgba(14, 165, 233, 0.12)',
        planBadgeText: '#0284C7',
        labelColor: '#64748B',
        valueColor: '#1E293B',
        dividerColor: 'rgba(147, 197, 253, 0.3)',
        iconColor: '#0EA5E9',
        gaugeBackground: '#F1F5F9',
        streakBackground: '#DBEAFE',
        streakText: '#1D4ED8',
        achievementCardBackground: 'rgba(255, 255, 255, 0.95)',
        achievementCardBorder: '#BAE6FD',
        milestoneBackground: '#F0F9FF',
        milestoneBorder: '#7DD3FC',
      },
      achievements: {
        background: '#F0F7FF',
        headerTitle: '#1E293B',
        backIcon: '#475569',
        heroTitle: '#1E293B',
        heroSubtitle: '#64748B',
        levelBadgeBackground: '#0EA5E9',
        levelBadgeText: '#FFFFFF',
        levelLabel: '#64748B',
        statValue: '#1E293B',
        statLabel: '#94A3B8',
        sectionTitle: '#1E293B',
        sectionCount: '#94A3B8',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        cardBorder: '#BAE6FD',
        cardTitle: '#334155',
        cardTitleLocked: '#94A3B8',
        tabBackground: 'rgba(255, 255, 255, 0.85)',
        tabBorder: '#7DD3FC',
        tabText: '#64748B',
        tabActiveBackground: '#0EA5E9',
        tabActiveText: '#FFFFFF',
        progressRingBackground: '#BAE6FD',
      },
      profile: {
        background: '#F0F7FF',
        headerTitle: '#1E293B',
        userCardBackground: 'rgba(255, 255, 255, 0.95)',
        userName: '#1E293B',
        userEmail: '#64748B',
        sectionTitle: '#1E293B',
        menuItemBackground: 'rgba(255, 255, 255, 0.95)',
        menuItemTitle: '#1E293B',
        menuItemSubtitle: '#64748B',
        menuItemIconBackground: '#DBEAFE',
        menuItemIconColor: '#0284C7',
        chevronColor: '#94A3B8',
        dangerZoneBackground: '#FEF2F2',
        dangerZoneWarning: '#64748B',
        dangerZoneButtonBackground: 'rgba(255, 255, 255, 0.98)',
        signOutBackground: 'rgba(255, 255, 255, 0.95)',
        signOutText: '#64748B',
        signOutIcon: '#94A3B8',
      },
      agentDetail: {
        background: '#F0F7FF',
        headerTitle: '#1E293B',
        backIcon: '#475569',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        agentName: '#1E293B',
        specialty: '#64748B',
        description: '#334155',
        sectionTitle: '#1E293B',
        chatButtonBackground: 'rgba(255, 255, 255, 0.98)',
        chatButtonText: '#1E293B',
        notFoundText: '#64748B',
        notFoundLink: '#0EA5E9',
      },
      reportCard: {
        background: 'rgba(255, 255, 255, 0.98)',
        title: '#1E293B',
        description: '#64748B',
        timestamp: '#94A3B8',
        shadowColor: '#000000',
      },
      chat: {
        background: '#F0F7FF',
        headerBackground: '#F0F7FF',
        headerTitle: '#1E293B',
        headerSubtitle: '#64748B',
        headerIcon: '#475569',
        agentBubble: 'rgba(255, 255, 255, 0.98)',
        agentText: '#1E293B',
        agentTimestamp: '#94A3B8',
        inputBackground: 'rgba(255, 255, 255, 0.98)',
        inputBorder: '#CBD5E1',
        inputText: '#1E293B',
        inputPlaceholder: '#94A3B8',
        errorBackground: '#FEF2F2',
        errorBorder: '#FECACA',
        errorText: '#991B1B',
        // Markdown colors
        markdownHeading: '#1E293B',
        markdownStrong: '#1E293B',
        markdownCodeBackground: '#DBEAFE',
        markdownCodeInlineBackground: 'rgba(30, 41, 59, 0.08)',
        markdownBlockquoteBackground: '#F0F9FF',
        markdownLink: '#0284C7',
        markdownHr: 'rgba(30, 41, 59, 0.12)',
      },
      modal: {
        background: '#F0F7FF',
        handleBar: '#7DD3FC',
        headerTitle: '#1E293B',
        headerSubtitle: '#64748B',
        closeButtonBackground: 'rgba(255, 255, 255, 0.98)',
        closeButtonIcon: '#1E293B',
        itemBackground: 'rgba(255, 255, 255, 0.98)',
        itemTitle: '#1E293B',
        itemDescription: '#64748B',
        itemBorder: '#E2E8F0',
        selectedBorder: '#0EA5E9',
        checkboxSelected: '#0EA5E9',
        checkboxUnselected: 'rgba(255, 255, 255, 0.98)',
        checkboxUnselectedBorder: '#CBD5E1',
        lockIconColor: '#64748B',
        featureTitle: '#1E293B',
        featureDescription: '#64748B',
        infoCardBackground: '#DBEAFE',
        infoCardBorder: '#93C5FD',
        infoCardText: '#1E40AF',
        infoCardIcon: '#0EA5E9',
        usageSectionBackground: 'rgba(255, 255, 255, 0.98)',
        usageSectionBorder: '#E2E8F0',
        usageLabel: '#94A3B8',
        usageValue: '#0284C7',
        usageBarBackground: '#E2E8F0',
        usageBarFill: '#0284C7',
        usagePercent: '#94A3B8',
        benefitsTitle: '#1E293B',
        benefitText: '#1E293B',
        benefitIcon: '#0EA5E9',
        upgradeButtonBackground: '#0EA5E9',
        upgradeButtonBorder: '#0284C7',
        upgradeButtonText: '#FFFFFF',
        dismissButtonBackground: 'rgba(255, 255, 255, 0.98)',
        dismissButtonBorder: '#E2E8F0',
        dismissButtonText: '#1E293B',
      },
      quest: {
        gradientColors: ['#F0F7FF', '#FFFFFF', '#E0F2FE'] as const,
        floatingCircle1: 'rgba(14, 165, 233, 0.08)',
        floatingCircle2: 'rgba(110, 215, 196, 0.08)',
        floatingCircle3: 'rgba(56, 189, 248, 0.06)',
        text: '#1E293B',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(0, 0, 0, 0.04)',
        badgeBackground: 'rgba(14, 165, 233, 0.1)',
        badgeText: '#0284C7',
        progressBarBackground: '#FFFFFF',
        progressBarFill: '#0EA5E9',
        progressDot: '#E2E8F0',
        progressDotActive: '#0EA5E9',
        backButtonBackground: 'rgba(255, 255, 255, 0.95)',
        backButtonBorder: 'rgba(0, 0, 0, 0.08)',
        backButtonIcon: '#1E293B',
        taskGradient1: ['#BAE6FD', '#7DD3FC'] as const,
        taskGradient2: ['#C7D2FE', '#A5B4FC'] as const,
        taskGradient3: ['#A7F3D0', '#6EE7B7'] as const,
        primaryButtonBackground: '#1E293B',
        primaryButtonText: '#FFFFFF',
        optionCardBackground: '#FFFFFF',
        optionCardBorder: 'rgba(0, 0, 0, 0.08)',
        optionSelectedGradient: ['#0EA5E9', '#38BDF8'] as const,
        optionSelectedBorder: '#0EA5E9',
        optionCheckBackground: '#FFFFFF',
        optionCheckIcon: '#0EA5E9',
        optionUnselectedBorder: '#CBD5E1',
        statBadgeBackground: '#E0F2FE',
        statBadgeText: '#0369A1',
        infoNoteBackground: '#E0F2FE',
        infoNoteBorder: 'rgba(0, 0, 0, 0.05)',
        infoNoteText: '#64748B',
        completionIconGradient: ['#6ED7C4', '#5AC4B3'] as const,
        completionIconShadow: '#6ED7C4',
        reportCardBackground: 'rgba(255, 255, 255, 0.95)',
        reportCardBorder: 'rgba(0, 0, 0, 0.04)',
        loadingDotColor: '#0EA5E9',
        celebrationBadgeGradient: ['#10B981', '#059669'] as const,
        answeredCardGradient: ['rgba(14, 165, 233, 0.12)', 'rgba(14, 165, 233, 0.06)'] as const,
        answeredCardBorder: 'rgba(14, 165, 233, 0.25)',
        questionNumberBadgeBackground: '#FFFFFF',
        questionNumberBadgeText: '#0EA5E9',
        answerPillBackground: 'rgba(255, 255, 255, 0.9)',
        answerPillText: '#0EA5E9',
        emptyCardBackground: '#FFFFFF',
        emptyCardBorder: 'rgba(209, 213, 219, 0.5)',
        emptyNumberBadgeBackground: '#E0F2FE',
        emptyNumberBadgeText: '#94A3B8',
        emptyPillBackground: '#F0F9FF',
        emptyPillBorder: '#BAE6FD',
        emptyPillText: '#94A3B8',
        warningBannerBackground: 'rgba(251, 191, 36, 0.1)',
        warningBannerBorder: 'rgba(217, 119, 6, 0.2)',
        warningBannerText: '#D97706',
        warningBannerIcon: '#D97706',
      },
      questReport: {
        background: '#F0F7FF',
        text: '#1E293B',
        textSecondary: '#64748B',
        cardBackground: 'rgba(255, 255, 255, 0.98)',
        cardBorder: '#BAE6FD',
        sectionItemBackground: 'rgba(255, 255, 255, 0.98)',
        infoNoteBackground: '#DBEAFE',
        infoNoteText: '#1E40AF',
        subsectionCardBackground: 'rgba(255, 255, 255, 0.95)',
        separatorColor: '#7DD3FC',
        footerBackground: '#F0F7FF',
        footerBorder: '#BAE6FD',
        processingSpinner: '#0EA5E9',
        errorIcon: '#0284C7',
        primaryButtonBackground: '#1E293B',
        primaryButtonText: '#FFFFFF',
        outlineButtonBackground: 'rgba(255, 255, 255, 0.98)',
        outlineButtonText: '#1E293B',
        outlineButtonBorder: '#CBD5E1',
        markdownText: '#1E293B',
        markdownHeading: '#1E293B',
        markdownCodeBackground: '#DBEAFE',
        markdownBlockquoteBackground: '#F0F9FF',
        markdownBlockquoteBorder: '#0EA5E9',
      },
      calls: {
        // Calls tab (history)
        background: '#F0F7FF',
        headerTitle: '#1E293B',
        emptyIconBackground: 'rgba(255, 255, 255, 0.98)',
        emptyIconBorder: '#BAE6FD',
        emptyTitle: '#1E293B',
        emptyMessage: '#64748B',
        ctaButtonBackground: '#0EA5E9',
        ctaButtonBorder: '#0284C7',
        ctaButtonText: '#FFFFFF',
        refreshTint: '#0EA5E9',
        loadingIndicator: '#0EA5E9',
        // Active call screen
        callBackground: '#F0F7FF',
        statusText: '#64748B',
        statusTextSubtle: '#94A3B8',
        durationText: '#1E293B',
        quotaBackground: 'rgba(255, 255, 255, 0.98)',
        quotaBackgroundWarning: '#FEF3C7',
        quotaText: '#64748B',
        quotaTextWarning: '#D97706',
        quotaIcon: '#64748B',
        quotaIconWarning: '#D97706',
        agentName: '#1E293B',
        agentSpecialty: '#64748B',
        participantText: '#64748B',
        participantSubtext: '#94A3B8',
        controlsBackground: 'rgba(255, 255, 255, 0.98)',
        controlsHandleBar: '#7DD3FC',
        buttonBackground: '#E0F2FE',
        buttonIcon: '#1E293B',
        muteActiveBackground: '#0EA5E9',
        muteActiveIcon: '#FFFFFF',
        endCallBackground: '#EF4444',
        endCallIcon: '#FFFFFF',
        errorIcon: '#EF4444',
        errorTitle: '#1E293B',
        errorMessage: '#64748B',
        retryButtonBackground: '#1E293B',
        retryButtonText: '#FFFFFF',
        backButtonBackground: '#E0F2FE',
        backButtonText: '#1E293B',
        notFoundBackground: '#F0F7FF',
        notFoundText: '#64748B',
      },
    };
  } else if (hour >= 17 && hour < 21) {
    // Evening: Sunset - soft lavender to warm pink
    return {
      text: 'Good evening',
      emoji: '🌅',
      subtitle: 'Time to wind down and reflect',
      gradientColors: ['#F5E6FA', '#FAE8F0', '#FFF0F3'] as const,
      background: '#F5E6FA',
      textColor: '#1F2937',
      subtitleColor: '#6B7280',
      userNameColor: '#9333EA', // Purple for evening
      isNightMode: false,
      sectionTitleColor: '#1F2937',
      sectionLinkColor: '#5A86FF',
      glass: {
        cardBackground: 'rgba(255, 255, 255, 0.7)',
        cardBorder: 'rgba(255, 255, 255, 0.3)',
        cardShadow: 'rgba(0, 0, 0, 0.08)',
      },
      floating: {
        circle1: 'rgba(168, 85, 247, 0.05)',
        circle2: 'rgba(110, 215, 196, 0.04)',
        circle3: 'rgba(192, 132, 252, 0.03)',
      },
      hero: {
        breathingOrb: 'rgba(168, 85, 247, 0.06)',
        greetingSize: 36,
      },
      card: {
        background: 'rgba(255, 255, 255, 0.85)',
        nameColor: '#1F2937',
        descriptionColor: '#6B7280',
        buttonBackground: 'rgba(245, 208, 254, 0.6)',
        buttonTextColor: '#86198F',
        buttonIconColor: '#A21CAF',
        lockBadgeBackground: '#FAE8FF',
        lockIconColor: '#86198F',
      },
      quickAction: {
        primaryBackground: '#A855F7',
        primaryTextColor: '#FFFFFF',
        primaryIconColor: '#FFFFFF',
        secondaryBackground: 'rgba(255, 255, 255, 0.85)',
        secondaryTextColor: '#7E22CE',
        secondaryIconColor: '#A855F7',
      },
      tabBar: {
        background: '#FAE8F0',
        borderColor: 'rgba(216, 180, 254, 0.4)',
        activeTint: '#A855F7',
        inactiveTint: '#9CA3AF',
        activeBackground: 'rgba(168, 85, 247, 0.15)',
      },
      usageCard: {
        background: 'rgba(255, 255, 255, 0.85)',
        planBadgeBackground: 'rgba(168, 85, 247, 0.12)',
        planBadgeText: '#9333EA',
        labelColor: '#71717A',
        valueColor: '#18181B',
        dividerColor: 'rgba(216, 180, 254, 0.3)',
        iconColor: '#A855F7',
        gaugeBackground: '#F4F4F5',
        streakBackground: '#F3E8FF',
        streakText: '#7E22CE',
        achievementCardBackground: 'rgba(255, 255, 255, 0.9)',
        achievementCardBorder: '#E9D5FF',
        milestoneBackground: '#FAF5FF',
        milestoneBorder: '#D8B4FE',
      },
      achievements: {
        background: '#FAE8F0',
        headerTitle: '#18181B',
        backIcon: '#52525B',
        heroTitle: '#18181B',
        heroSubtitle: '#71717A',
        levelBadgeBackground: '#A855F7',
        levelBadgeText: '#FFFFFF',
        levelLabel: '#71717A',
        statValue: '#18181B',
        statLabel: '#A1A1AA',
        sectionTitle: '#18181B',
        sectionCount: '#A1A1AA',
        cardBackground: 'rgba(255, 255, 255, 0.9)',
        cardBorder: '#E9D5FF',
        cardTitle: '#3F3F46',
        cardTitleLocked: '#A1A1AA',
        tabBackground: 'rgba(255, 255, 255, 0.8)',
        tabBorder: '#D8B4FE',
        tabText: '#71717A',
        tabActiveBackground: '#A855F7',
        tabActiveText: '#FFFFFF',
        progressRingBackground: '#E9D5FF',
      },
      profile: {
        background: '#FAE8F0',
        headerTitle: '#18181B',
        userCardBackground: 'rgba(255, 255, 255, 0.9)',
        userName: '#18181B',
        userEmail: '#71717A',
        sectionTitle: '#18181B',
        menuItemBackground: 'rgba(255, 255, 255, 0.9)',
        menuItemTitle: '#18181B',
        menuItemSubtitle: '#71717A',
        menuItemIconBackground: '#F3E8FF',
        menuItemIconColor: '#9333EA',
        chevronColor: '#A1A1AA',
        dangerZoneBackground: '#FEF2F2',
        dangerZoneWarning: '#71717A',
        dangerZoneButtonBackground: 'rgba(255, 255, 255, 0.95)',
        signOutBackground: 'rgba(255, 255, 255, 0.9)',
        signOutText: '#71717A',
        signOutIcon: '#A1A1AA',
      },
      agentDetail: {
        background: '#FAE8F0',
        headerTitle: '#18181B',
        backIcon: '#52525B',
        cardBackground: 'rgba(255, 255, 255, 0.9)',
        agentName: '#18181B',
        specialty: '#71717A',
        description: '#3F3F46',
        sectionTitle: '#18181B',
        chatButtonBackground: 'rgba(255, 255, 255, 0.95)',
        chatButtonText: '#18181B',
        notFoundText: '#71717A',
        notFoundLink: '#A855F7',
      },
      reportCard: {
        background: 'rgba(255, 255, 255, 0.95)',
        title: '#18181B',
        description: '#71717A',
        timestamp: '#A1A1AA',
        shadowColor: '#000000',
      },
      chat: {
        background: '#FAE8F0',
        headerBackground: '#FAE8F0',
        headerTitle: '#18181B',
        headerSubtitle: '#71717A',
        headerIcon: '#52525B',
        agentBubble: 'rgba(255, 255, 255, 0.95)',
        agentText: '#18181B',
        agentTimestamp: '#A1A1AA',
        inputBackground: 'rgba(255, 255, 255, 0.95)',
        inputBorder: '#D4D4D8',
        inputText: '#18181B',
        inputPlaceholder: '#A1A1AA',
        errorBackground: '#FEF2F2',
        errorBorder: '#FECACA',
        errorText: '#991B1B',
        // Markdown colors
        markdownHeading: '#18181B',
        markdownStrong: '#18181B',
        markdownCodeBackground: '#F3E8FF',
        markdownCodeInlineBackground: 'rgba(24, 24, 27, 0.08)',
        markdownBlockquoteBackground: '#FAF5FF',
        markdownLink: '#9333EA',
        markdownHr: 'rgba(24, 24, 27, 0.12)',
      },
      modal: {
        background: '#FAE8F0',
        handleBar: '#D8B4FE',
        headerTitle: '#18181B',
        headerSubtitle: '#71717A',
        closeButtonBackground: 'rgba(255, 255, 255, 0.95)',
        closeButtonIcon: '#18181B',
        itemBackground: 'rgba(255, 255, 255, 0.95)',
        itemTitle: '#18181B',
        itemDescription: '#71717A',
        itemBorder: '#E4E4E7',
        selectedBorder: '#A855F7',
        checkboxSelected: '#A855F7',
        checkboxUnselected: 'rgba(255, 255, 255, 0.95)',
        checkboxUnselectedBorder: '#D4D4D8',
        lockIconColor: '#71717A',
        featureTitle: '#18181B',
        featureDescription: '#71717A',
        infoCardBackground: '#F3E8FF',
        infoCardBorder: '#D8B4FE',
        infoCardText: '#7E22CE',
        infoCardIcon: '#A855F7',
        usageSectionBackground: 'rgba(255, 255, 255, 0.95)',
        usageSectionBorder: '#E4E4E7',
        usageLabel: '#A1A1AA',
        usageValue: '#9333EA',
        usageBarBackground: '#E4E4E7',
        usageBarFill: '#9333EA',
        usagePercent: '#A1A1AA',
        benefitsTitle: '#18181B',
        benefitText: '#18181B',
        benefitIcon: '#A855F7',
        upgradeButtonBackground: '#A855F7',
        upgradeButtonBorder: '#9333EA',
        upgradeButtonText: '#FFFFFF',
        dismissButtonBackground: 'rgba(255, 255, 255, 0.95)',
        dismissButtonBorder: '#E4E4E7',
        dismissButtonText: '#18181B',
      },
      quest: {
        gradientColors: ['#FAE8F0', '#FFFFFF', '#F3E8FF'] as const,
        floatingCircle1: 'rgba(168, 85, 247, 0.08)',
        floatingCircle2: 'rgba(110, 215, 196, 0.08)',
        floatingCircle3: 'rgba(192, 132, 252, 0.06)',
        text: '#18181B',
        textSecondary: '#71717A',
        textMuted: '#A1A1AA',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        cardBorder: 'rgba(0, 0, 0, 0.04)',
        badgeBackground: 'rgba(168, 85, 247, 0.1)',
        badgeText: '#9333EA',
        progressBarBackground: '#FFFFFF',
        progressBarFill: '#A855F7',
        progressDot: '#E4E4E7',
        progressDotActive: '#A855F7',
        backButtonBackground: 'rgba(255, 255, 255, 0.95)',
        backButtonBorder: 'rgba(0, 0, 0, 0.08)',
        backButtonIcon: '#18181B',
        taskGradient1: ['#E9D5FF', '#D8B4FE'] as const,
        taskGradient2: ['#FBCFE8', '#F9A8D4'] as const,
        taskGradient3: ['#A7F3D0', '#6EE7B7'] as const,
        primaryButtonBackground: '#18181B',
        primaryButtonText: '#FFFFFF',
        optionCardBackground: '#FFFFFF',
        optionCardBorder: 'rgba(0, 0, 0, 0.08)',
        optionSelectedGradient: ['#A855F7', '#C084FC'] as const,
        optionSelectedBorder: '#A855F7',
        optionCheckBackground: '#FFFFFF',
        optionCheckIcon: '#A855F7',
        optionUnselectedBorder: '#D4D4D8',
        statBadgeBackground: '#F3E8FF',
        statBadgeText: '#7E22CE',
        infoNoteBackground: '#F3E8FF',
        infoNoteBorder: 'rgba(0, 0, 0, 0.05)',
        infoNoteText: '#71717A',
        completionIconGradient: ['#6ED7C4', '#5AC4B3'] as const,
        completionIconShadow: '#6ED7C4',
        reportCardBackground: 'rgba(255, 255, 255, 0.95)',
        reportCardBorder: 'rgba(0, 0, 0, 0.04)',
        loadingDotColor: '#A855F7',
        celebrationBadgeGradient: ['#10B981', '#059669'] as const,
        answeredCardGradient: ['rgba(168, 85, 247, 0.12)', 'rgba(168, 85, 247, 0.06)'] as const,
        answeredCardBorder: 'rgba(168, 85, 247, 0.25)',
        questionNumberBadgeBackground: '#FFFFFF',
        questionNumberBadgeText: '#A855F7',
        answerPillBackground: 'rgba(255, 255, 255, 0.9)',
        answerPillText: '#A855F7',
        emptyCardBackground: '#FFFFFF',
        emptyCardBorder: 'rgba(209, 213, 219, 0.5)',
        emptyNumberBadgeBackground: '#F3E8FF',
        emptyNumberBadgeText: '#A1A1AA',
        emptyPillBackground: '#FAF5FF',
        emptyPillBorder: '#E9D5FF',
        emptyPillText: '#A1A1AA',
        warningBannerBackground: 'rgba(251, 191, 36, 0.1)',
        warningBannerBorder: 'rgba(217, 119, 6, 0.2)',
        warningBannerText: '#D97706',
        warningBannerIcon: '#D97706',
      },
      questReport: {
        background: '#FAE8F0',
        text: '#18181B',
        textSecondary: '#71717A',
        cardBackground: 'rgba(255, 255, 255, 0.95)',
        cardBorder: '#E9D5FF',
        sectionItemBackground: 'rgba(255, 255, 255, 0.95)',
        infoNoteBackground: '#F3E8FF',
        infoNoteText: '#7E22CE',
        subsectionCardBackground: 'rgba(255, 255, 255, 0.9)',
        separatorColor: '#D8B4FE',
        footerBackground: '#FAE8F0',
        footerBorder: '#E9D5FF',
        processingSpinner: '#A855F7',
        errorIcon: '#9333EA',
        primaryButtonBackground: '#18181B',
        primaryButtonText: '#FFFFFF',
        outlineButtonBackground: 'rgba(255, 255, 255, 0.95)',
        outlineButtonText: '#18181B',
        outlineButtonBorder: '#D4D4D8',
        markdownText: '#18181B',
        markdownHeading: '#18181B',
        markdownCodeBackground: '#F3E8FF',
        markdownBlockquoteBackground: '#FAF5FF',
        markdownBlockquoteBorder: '#A855F7',
      },
      calls: {
        // Calls tab (history)
        background: '#FAE8F0',
        headerTitle: '#18181B',
        emptyIconBackground: 'rgba(255, 255, 255, 0.95)',
        emptyIconBorder: '#E9D5FF',
        emptyTitle: '#18181B',
        emptyMessage: '#71717A',
        ctaButtonBackground: '#A855F7',
        ctaButtonBorder: '#9333EA',
        ctaButtonText: '#FFFFFF',
        refreshTint: '#A855F7',
        loadingIndicator: '#A855F7',
        // Active call screen
        callBackground: '#FAE8F0',
        statusText: '#71717A',
        statusTextSubtle: '#A1A1AA',
        durationText: '#18181B',
        quotaBackground: 'rgba(255, 255, 255, 0.95)',
        quotaBackgroundWarning: '#FEF3C7',
        quotaText: '#71717A',
        quotaTextWarning: '#D97706',
        quotaIcon: '#71717A',
        quotaIconWarning: '#D97706',
        agentName: '#18181B',
        agentSpecialty: '#71717A',
        participantText: '#71717A',
        participantSubtext: '#A1A1AA',
        controlsBackground: 'rgba(255, 255, 255, 0.98)',
        controlsHandleBar: '#D8B4FE',
        buttonBackground: '#F3E8FF',
        buttonIcon: '#18181B',
        muteActiveBackground: '#A855F7',
        muteActiveIcon: '#FFFFFF',
        endCallBackground: '#EF4444',
        endCallIcon: '#FFFFFF',
        errorIcon: '#EF4444',
        errorTitle: '#18181B',
        errorMessage: '#71717A',
        retryButtonBackground: '#18181B',
        retryButtonText: '#FFFFFF',
        backButtonBackground: '#F3E8FF',
        backButtonText: '#18181B',
        notFoundBackground: '#FAE8F0',
        notFoundText: '#71717A',
      },
    };
  } else {
    // Night: Serene midnight - deep navy to soft violet for restful sleep
    // Based on dark mode best practices: no pure black, softer whites, de-saturated accents
    return {
      text: 'Good night',
      emoji: '🌙',
      subtitle: 'Rest well, you deserve it',
      // Deeper, more calming gradient - navy to soft violet
      gradientColors: ['#0F0D1A', '#1A1625', '#241E35'] as const,
      background: '#0F0D1A',
      textColor: '#F8FAFC', // Softer than pure white
      subtitleColor: '#CBD5E1',
      userNameColor: '#C4B5FD', // Soft violet for night
      isNightMode: true,
      sectionTitleColor: '#F1F5F9',
      sectionLinkColor: '#C4B5FD', // Softer violet
      glass: {
        cardBackground: 'rgba(30, 25, 50, 0.65)',
        cardBorder: 'rgba(167, 139, 250, 0.25)', // Softer violet border
        cardShadow: 'rgba(139, 92, 246, 0.15)', // Subtle glow instead of dark shadow
      },
      floating: {
        // Subtle, calming floating elements for night
        circle1: 'rgba(167, 139, 250, 0.08)', // Soft violet
        circle2: 'rgba(129, 140, 248, 0.06)', // Soft indigo
        circle3: 'rgba(196, 181, 253, 0.05)', // Pale violet
      },
      hero: {
        breathingOrb: 'rgba(167, 139, 250, 0.10)', // Subtle breathing orb
        greetingSize: 36,
      },
      card: {
        background: 'rgba(30, 25, 50, 0.75)',
        nameColor: '#F8FAFC',
        descriptionColor: '#CBD5E1',
        buttonBackground: 'rgba(139, 92, 246, 0.25)',
        buttonTextColor: '#E9D5FF',
        buttonIconColor: '#C4B5FD',
        lockBadgeBackground: 'rgba(139, 92, 246, 0.25)',
        lockIconColor: '#C4B5FD',
      },
      quickAction: {
        primaryBackground: '#7C3AED', // Violet-600 - softer than indigo
        primaryTextColor: '#F8FAFC',
        primaryIconColor: '#F8FAFC',
        secondaryBackground: 'rgba(139, 92, 246, 0.20)',
        secondaryTextColor: '#E9D5FF',
        secondaryIconColor: '#C4B5FD',
      },
      tabBar: {
        background: '#0F0D1A',
        borderColor: 'rgba(139, 92, 246, 0.25)',
        activeTint: '#C4B5FD',
        inactiveTint: '#64748B',
        activeBackground: 'rgba(167, 139, 250, 0.20)',
      },
      usageCard: {
        background: 'rgba(30, 25, 50, 0.75)',
        planBadgeBackground: 'rgba(167, 139, 250, 0.20)',
        planBadgeText: '#C4B5FD',
        labelColor: '#94A3B8',
        valueColor: '#F1F5F9',
        dividerColor: 'rgba(139, 92, 246, 0.20)',
        iconColor: '#A78BFA',
        gaugeBackground: 'rgba(139, 92, 246, 0.20)',
        streakBackground: 'rgba(167, 139, 250, 0.18)',
        streakText: '#DDD6FE',
        achievementCardBackground: 'rgba(36, 30, 53, 0.7)',
        achievementCardBorder: 'rgba(167, 139, 250, 0.25)',
        milestoneBackground: 'rgba(124, 58, 237, 0.20)',
        milestoneBorder: 'rgba(196, 181, 253, 0.35)',
      },
      achievements: {
        background: '#0F0D1A',
        headerTitle: '#F1F5F9',
        backIcon: '#C4B5FD',
        heroTitle: '#F1F5F9',
        heroSubtitle: '#94A3B8',
        levelBadgeBackground: '#7C3AED',
        levelBadgeText: '#F8FAFC',
        levelLabel: '#94A3B8',
        statValue: '#F1F5F9',
        statLabel: '#64748B',
        sectionTitle: '#F1F5F9',
        sectionCount: '#64748B',
        cardBackground: 'rgba(36, 30, 53, 0.7)',
        cardBorder: 'rgba(167, 139, 250, 0.25)',
        cardTitle: '#E9D5FF',
        cardTitleLocked: '#64748B',
        tabBackground: 'rgba(36, 30, 53, 0.6)',
        tabBorder: 'rgba(139, 92, 246, 0.25)',
        tabText: '#94A3B8',
        tabActiveBackground: '#7C3AED',
        tabActiveText: '#F8FAFC',
        progressRingBackground: 'rgba(139, 92, 246, 0.25)',
      },
      profile: {
        background: '#0F0D1A',
        headerTitle: '#F1F5F9',
        userCardBackground: 'rgba(36, 30, 53, 0.7)',
        userName: '#F1F5F9',
        userEmail: '#94A3B8',
        sectionTitle: '#F1F5F9',
        menuItemBackground: 'rgba(36, 30, 53, 0.7)',
        menuItemTitle: '#E9D5FF',
        menuItemSubtitle: '#94A3B8',
        menuItemIconBackground: 'rgba(139, 92, 246, 0.25)',
        menuItemIconColor: '#C4B5FD',
        chevronColor: '#64748B',
        dangerZoneBackground: 'rgba(127, 29, 29, 0.15)',
        dangerZoneWarning: '#94A3B8',
        dangerZoneButtonBackground: 'rgba(36, 30, 53, 0.85)',
        signOutBackground: 'rgba(36, 30, 53, 0.7)',
        signOutText: '#94A3B8',
        signOutIcon: '#64748B',
      },
      agentDetail: {
        background: '#0F0D1A',
        headerTitle: '#F1F5F9',
        backIcon: '#C4B5FD',
        cardBackground: 'rgba(36, 30, 53, 0.7)',
        agentName: '#F1F5F9',
        specialty: '#94A3B8',
        description: '#CBD5E1',
        sectionTitle: '#F1F5F9',
        chatButtonBackground: 'rgba(36, 30, 53, 0.85)',
        chatButtonText: '#E9D5FF',
        notFoundText: '#94A3B8',
        notFoundLink: '#C4B5FD',
      },
      reportCard: {
        background: 'rgba(36, 30, 53, 0.75)',
        title: '#F1F5F9',
        description: '#94A3B8',
        timestamp: '#64748B',
        shadowColor: 'rgba(139, 92, 246, 0.15)', // Subtle glow
      },
      chat: {
        background: '#0F0D1A',
        headerBackground: '#0F0D1A',
        headerTitle: '#F1F5F9',
        headerSubtitle: '#94A3B8',
        headerIcon: '#C4B5FD',
        agentBubble: 'rgba(36, 30, 53, 0.75)',
        agentText: '#E9D5FF',
        agentTimestamp: '#64748B',
        inputBackground: 'rgba(36, 30, 53, 0.75)',
        inputBorder: 'rgba(139, 92, 246, 0.30)',
        inputText: '#E9D5FF',
        inputPlaceholder: '#64748B',
        errorBackground: 'rgba(127, 29, 29, 0.25)',
        errorBorder: 'rgba(239, 68, 68, 0.35)',
        errorText: '#FCA5A5',
        // Markdown colors - softer for dark mode
        markdownHeading: '#F1F5F9',
        markdownStrong: '#F1F5F9',
        markdownCodeBackground: 'rgba(139, 92, 246, 0.15)',
        markdownCodeInlineBackground: 'rgba(233, 213, 255, 0.12)',
        markdownBlockquoteBackground: 'rgba(124, 58, 237, 0.20)',
        markdownLink: '#C4B5FD',
        markdownHr: 'rgba(139, 92, 246, 0.25)',
      },
      modal: {
        background: '#0F0D1A',
        handleBar: 'rgba(167, 139, 250, 0.45)',
        headerTitle: '#F1F5F9',
        headerSubtitle: '#94A3B8',
        closeButtonBackground: 'rgba(36, 30, 53, 0.85)',
        closeButtonIcon: '#C4B5FD',
        itemBackground: 'rgba(36, 30, 53, 0.7)',
        itemTitle: '#E9D5FF',
        itemDescription: '#94A3B8',
        itemBorder: 'rgba(139, 92, 246, 0.25)',
        selectedBorder: '#8B5CF6',
        checkboxSelected: '#8B5CF6',
        checkboxUnselected: 'rgba(36, 30, 53, 0.7)',
        checkboxUnselectedBorder: 'rgba(139, 92, 246, 0.35)',
        lockIconColor: '#64748B',
        featureTitle: '#E9D5FF',
        featureDescription: '#94A3B8',
        infoCardBackground: 'rgba(139, 92, 246, 0.15)',
        infoCardBorder: 'rgba(167, 139, 250, 0.25)',
        infoCardText: '#DDD6FE',
        infoCardIcon: '#A78BFA',
        usageSectionBackground: 'rgba(36, 30, 53, 0.7)',
        usageSectionBorder: 'rgba(139, 92, 246, 0.25)',
        usageLabel: '#64748B',
        usageValue: '#C4B5FD',
        usageBarBackground: 'rgba(139, 92, 246, 0.25)',
        usageBarFill: '#A78BFA',
        usagePercent: '#64748B',
        benefitsTitle: '#E9D5FF',
        benefitText: '#E9D5FF',
        benefitIcon: '#A78BFA',
        upgradeButtonBackground: '#7C3AED',
        upgradeButtonBorder: '#6D28D9',
        upgradeButtonText: '#F8FAFC',
        dismissButtonBackground: 'rgba(36, 30, 53, 0.85)',
        dismissButtonBorder: 'rgba(139, 92, 246, 0.35)',
        dismissButtonText: '#E9D5FF',
      },
      quest: {
        gradientColors: ['#0F0D1A', '#1A1625', '#241E35'] as const,
        floatingCircle1: 'rgba(167, 139, 250, 0.18)',
        floatingCircle2: 'rgba(129, 140, 248, 0.12)',
        floatingCircle3: 'rgba(196, 181, 253, 0.10)',
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        cardBackground: 'rgba(36, 30, 53, 0.75)',
        cardBorder: 'rgba(139, 92, 246, 0.20)',
        badgeBackground: 'rgba(139, 92, 246, 0.18)',
        badgeText: '#C4B5FD',
        progressBarBackground: 'rgba(36, 30, 53, 0.65)',
        progressBarFill: '#8B5CF6',
        progressDot: 'rgba(139, 92, 246, 0.25)',
        progressDotActive: '#8B5CF6',
        backButtonBackground: 'rgba(36, 30, 53, 0.85)',
        backButtonBorder: 'rgba(139, 92, 246, 0.25)',
        backButtonIcon: '#C4B5FD',
        taskGradient1: ['rgba(167, 139, 250, 0.35)', 'rgba(139, 92, 246, 0.25)'] as const,
        taskGradient2: ['rgba(196, 181, 253, 0.35)', 'rgba(167, 139, 250, 0.25)'] as const,
        taskGradient3: ['rgba(52, 211, 153, 0.25)', 'rgba(16, 185, 129, 0.18)'] as const,
        primaryButtonBackground: '#7C3AED',
        primaryButtonText: '#F8FAFC',
        optionCardBackground: 'rgba(36, 30, 53, 0.7)',
        optionCardBorder: 'rgba(139, 92, 246, 0.20)',
        optionSelectedGradient: ['#7C3AED', '#8B5CF6'] as const,
        optionSelectedBorder: '#8B5CF6',
        optionCheckBackground: '#F8FAFC',
        optionCheckIcon: '#7C3AED',
        optionUnselectedBorder: 'rgba(139, 92, 246, 0.35)',
        statBadgeBackground: 'rgba(139, 92, 246, 0.18)',
        statBadgeText: '#DDD6FE',
        infoNoteBackground: 'rgba(139, 92, 246, 0.12)',
        infoNoteBorder: 'rgba(139, 92, 246, 0.18)',
        infoNoteText: '#94A3B8',
        completionIconGradient: ['#34D399', '#10B981'] as const,
        completionIconShadow: '#34D399',
        reportCardBackground: 'rgba(36, 30, 53, 0.75)',
        reportCardBorder: 'rgba(139, 92, 246, 0.20)',
        loadingDotColor: '#A78BFA',
        celebrationBadgeGradient: ['#34D399', '#10B981'] as const,
        answeredCardGradient: ['rgba(139, 92, 246, 0.18)', 'rgba(139, 92, 246, 0.08)'] as const,
        answeredCardBorder: 'rgba(139, 92, 246, 0.30)',
        questionNumberBadgeBackground: 'rgba(255, 255, 255, 0.08)',
        questionNumberBadgeText: '#C4B5FD',
        answerPillBackground: 'rgba(36, 30, 53, 0.85)',
        answerPillText: '#C4B5FD',
        emptyCardBackground: 'rgba(36, 30, 53, 0.55)',
        emptyCardBorder: 'rgba(139, 92, 246, 0.18)',
        emptyNumberBadgeBackground: 'rgba(139, 92, 246, 0.12)',
        emptyNumberBadgeText: '#64748B',
        emptyPillBackground: 'rgba(36, 30, 53, 0.45)',
        emptyPillBorder: 'rgba(139, 92, 246, 0.25)',
        emptyPillText: '#64748B',
        warningBannerBackground: 'rgba(251, 191, 36, 0.12)',
        warningBannerBorder: 'rgba(217, 119, 6, 0.25)',
        warningBannerText: '#FCD34D', // Softer yellow
        warningBannerIcon: '#FCD34D',
      },
      questReport: {
        background: '#0F0D1A',
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        cardBackground: 'rgba(36, 30, 53, 0.7)',
        cardBorder: 'rgba(167, 139, 250, 0.25)',
        sectionItemBackground: 'rgba(36, 30, 53, 0.7)',
        infoNoteBackground: 'rgba(139, 92, 246, 0.15)',
        infoNoteText: '#DDD6FE',
        subsectionCardBackground: 'rgba(36, 30, 53, 0.55)',
        separatorColor: 'rgba(139, 92, 246, 0.30)',
        footerBackground: '#0F0D1A',
        footerBorder: 'rgba(139, 92, 246, 0.25)',
        processingSpinner: '#A78BFA',
        errorIcon: '#C4B5FD',
        primaryButtonBackground: '#7C3AED',
        primaryButtonText: '#F8FAFC',
        outlineButtonBackground: 'rgba(36, 30, 53, 0.85)',
        outlineButtonText: '#E9D5FF',
        outlineButtonBorder: 'rgba(139, 92, 246, 0.35)',
        markdownText: '#E9D5FF',
        markdownHeading: '#F1F5F9',
        markdownCodeBackground: 'rgba(139, 92, 246, 0.15)',
        markdownBlockquoteBackground: 'rgba(124, 58, 237, 0.20)',
        markdownBlockquoteBorder: '#A78BFA',
      },
      calls: {
        // Calls tab (history)
        background: '#0F0D1A',
        headerTitle: '#F1F5F9',
        emptyIconBackground: 'rgba(36, 30, 53, 0.75)',
        emptyIconBorder: 'rgba(139, 92, 246, 0.25)',
        emptyTitle: '#F1F5F9',
        emptyMessage: '#94A3B8',
        ctaButtonBackground: '#7C3AED',
        ctaButtonBorder: '#6D28D9',
        ctaButtonText: '#F8FAFC',
        refreshTint: '#A78BFA',
        loadingIndicator: '#A78BFA',
        // Active call screen
        callBackground: '#0F0D1A',
        statusText: '#94A3B8',
        statusTextSubtle: '#64748B',
        durationText: '#F1F5F9',
        quotaBackground: 'rgba(36, 30, 53, 0.75)',
        quotaBackgroundWarning: 'rgba(251, 191, 36, 0.15)',
        quotaText: '#94A3B8',
        quotaTextWarning: '#FCD34D',
        quotaIcon: '#94A3B8',
        quotaIconWarning: '#FCD34D',
        agentName: '#F1F5F9',
        agentSpecialty: '#94A3B8',
        participantText: '#94A3B8',
        participantSubtext: '#64748B',
        controlsBackground: 'rgba(36, 30, 53, 0.92)',
        controlsHandleBar: 'rgba(167, 139, 250, 0.45)',
        buttonBackground: 'rgba(139, 92, 246, 0.25)',
        buttonIcon: '#E9D5FF',
        muteActiveBackground: '#7C3AED',
        muteActiveIcon: '#F8FAFC',
        endCallBackground: '#DC2626', // Slightly softer red
        endCallIcon: '#F8FAFC',
        errorIcon: '#F87171',
        errorTitle: '#F1F5F9',
        errorMessage: '#94A3B8',
        retryButtonBackground: '#F1F5F9',
        retryButtonText: '#0F0D1A',
        backButtonBackground: 'rgba(139, 92, 246, 0.25)',
        backButtonText: '#E9D5FF',
        notFoundBackground: '#0F0D1A',
        notFoundText: '#94A3B8',
      },
    };
  }
};
