import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

import { CallHistoryItem, CallInfoSheet } from '@/components/screens/calls';
import { useCallHistory } from '@/hooks';
import { CallHistory } from '@/lib/types';
import { callsStyles } from '@/lib/styles/screens/tabs/calls.styles';
import { ROUTES } from '@/lib/routes';
import CallSvg from '@/assets/svgs/call.svg';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { Avatar } from '@/components/common/Avatar';
import { logger } from '@/lib/utils/logger';

const PAGE_SIZE = 20;

export default function CallsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);
  const { user } = useUser();
  const [isCallInfoSheetVisible, setIsCallInfoSheetVisible] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallHistory | null>(null);
  const [allCalls, setAllCalls] = useState<CallHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingForced, setIsRefreshingForced] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { calls, loading, error, refetch } = useCallHistory({
    offset: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const { calls: refreshCalls, refetch: refreshFetch } = useCallHistory({
    offset: 0,
    limit: PAGE_SIZE,
  });

  // Update allCalls when new calls are fetched from pagination
  React.useEffect(() => {
    if (isRefreshingForced) return; // Skip if we're doing a forced refresh

    if (currentPage === 0) {
      // First page - replace all calls
      setAllCalls(calls);
    } else {
      // Subsequent pages - append to existing calls
      if (calls.length > 0) {
        setAllCalls(prev => [...prev, ...calls]);
      }
    }

    // Check if there's more data
    if (calls.length < PAGE_SIZE) {
      setHasMoreData(false);
    }

    setIsLoadingMore(false);

    logger.debug('[CallsScreen] Updated calls:', {
      totalCount: allCalls.length + calls.length,
      currentPage,
      loading,
      error,
    });
  }, [calls, currentPage, isRefreshingForced]);

  // Update allCalls when doing a pull-to-refresh
  React.useEffect(() => {
    if (isRefreshingForced && refreshCalls.length > 0) {
      // Replace all calls with refreshed data
      setAllCalls(refreshCalls);
      setCurrentPage(0);
      setHasMoreData(refreshCalls.length >= PAGE_SIZE);
      setIsRefreshingForced(false);
      setIsRefreshing(false);

      logger.debug('[CallsScreen] Refreshed calls:', {
        totalCount: refreshCalls.length,
        loading: false,
      });
    }
  }, [refreshCalls, isRefreshingForced]);

  const handleLoadMore = useCallback(() => {
    if (loading || isLoadingMore || !hasMoreData) {
      return;
    }

    logger.debug('[CallsScreen] Loading more calls - Page:', currentPage + 1);
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  }, [loading, isLoadingMore, hasMoreData, currentPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsRefreshingForced(true);
    await refreshFetch();
  }, [refreshFetch]);

  const handleCallPress = (callId: string) => {
    const call = allCalls.find(c => c.id === callId);
    if (call) {
      logger.debug('[CallsScreen] Selected call:', call.id);
      setSelectedCall(call);
      setIsCallInfoSheetVisible(true);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore && !loading) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.calls.loadingIndicator} />
      </View>
    );
  };

  return (
    <View style={[callsStyles.safeArea, { backgroundColor: theme.calls.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={[callsStyles.header.container, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[callsStyles.header.title, { color: theme.calls.headerTitle }]}>
          Calls
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 22,
            overflow: 'hidden',
            backgroundColor: theme.glass.cardBackground,
            borderWidth: 2,
            borderColor: theme.glass.cardBorder,
          }}
          activeOpacity={0.7}
        >
          {user?.imageUrl ? (
            <Avatar avatar={user.imageUrl} size={40} />
          ) : (
            <Ionicons name="person-circle-outline" size={40} color={theme.textColor} />
          )}
        </TouchableOpacity>
      </View>

      {/* Calls List */}
      {allCalls.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={allCalls}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CallHistoryItem
              call={item}
              onPress={() => handleCallPress(item.id)}
              theme={theme}
            />
          )}
          style={callsStyles.list.scrollView}
          contentContainerStyle={callsStyles.list.scrollContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.calls.refreshTint}
            />
          }
        />
      ) : (
        // Empty state
        <View style={callsStyles.emptyState.container}>
          <View style={[
            callsStyles.emptyState.iconContainer,
            { backgroundColor: theme.calls.emptyIconBackground, borderColor: theme.calls.emptyIconBorder }
          ]}>
            <CallSvg width={40} height={40} color={theme.calls.ctaButtonBackground} />
          </View>

          <Text style={[callsStyles.emptyState.title, { color: theme.calls.emptyTitle }]}>
            No calls yet
          </Text>

          <Text style={[callsStyles.emptyState.message, { color: theme.calls.emptyMessage }]}>
            Your call history with AI coaches will appear here once you make your first call.
          </Text>

          <TouchableOpacity
            onPress={() => router.replace(ROUTES.TABS.HOME)}
            style={[
              callsStyles.emptyState.ctaButton,
              { backgroundColor: theme.calls.ctaButtonBackground, borderColor: theme.calls.ctaButtonBorder }
            ]}
          >
            <Text style={[callsStyles.emptyState.ctaButtonText, { color: theme.calls.ctaButtonText }]}>
              Browse Coaches
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Call Information Sheet */}
      <CallInfoSheet
        isVisible={isCallInfoSheetVisible}
        onClose={() => setIsCallInfoSheetVisible(false)}
        call={selectedCall}
        theme={theme}
      />
    </View>
  );
}
