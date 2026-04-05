/**
 * FloatingTabBar - Premium Floating Tab Navigation
 *
 * A modern iOS-style floating tab bar with:
 * - Pill-shaped container with glassmorphic effect
 * - Animated active indicator
 * - Subtle shadows and borders
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import HomeSvg from '@/assets/svgs/home.svg';
import CallSvg from '@/assets/svgs/call.svg';
import ChatSvg from '@/assets/svgs/chat.svg';
import { TimeTheme } from '@/lib/utils/time-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32;
const TAB_COUNT = 3;
const TAB_WIDTH = (TAB_BAR_WIDTH - 32) / TAB_COUNT;

interface FloatingTabBarProps extends BottomTabBarProps {
  theme: TimeTheme;
}

const getIcon = (routeName: string, color: string, size: number) => {
  switch (routeName) {
    case 'index':
      return <HomeSvg width={size} height={size} color={color} />;
    case 'chat':
      return <ChatSvg width={size} height={size} color={color} />;
    case 'calls':
      return <CallSvg width={size} height={size} color={color} />;
    default:
      return <HomeSvg width={size} height={size} color={color} />;
  }
};

const getLabel = (routeName: string) => {
  switch (routeName) {
    case 'index':
      return 'Home';
    case 'chat':
      return 'Chat';
    case 'calls':
      return 'Calls';
    default:
      return routeName;
  }
};

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const isNightMode = theme.isNightMode;

  // Get visible tabs (exclude profile - it's in the header now)
  const hiddenTabs = ['profile'];
  const visibleRoutes = state.routes.filter((route) => !hiddenTabs.includes(route.name));

  // Find the visible index of the current tab
  const visibleIndex = visibleRoutes.findIndex(
    (route) => route.key === state.routes[state.index]?.key
  );

  // Animate indicator when tab changes
  useEffect(() => {
    const targetIndex = visibleIndex >= 0 ? visibleIndex : 0;
    Animated.spring(indicatorAnim, {
      toValue: targetIndex * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [visibleIndex]);

  // Check if we should hide the entire tab bar (e.g., on chat screen)
  const currentRoute = state.routes[state.index];
  const currentDescriptor = descriptors[currentRoute.key];
  const currentTabBarStyle = currentDescriptor.options.tabBarStyle as any;

  if (currentTabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isNightMode
              ? 'rgba(30, 27, 75, 0.95)'
              : 'rgba(255, 255, 255, 0.92)',
            borderColor: isNightMode
              ? 'rgba(99, 102, 241, 0.25)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        {/* Animated active indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: isNightMode
                ? 'rgba(99, 102, 241, 0.25)'
                : 'rgba(90, 134, 255, 0.15)',
              transform: [{ translateX: Animated.add(indicatorAnim, 16) }],
            },
          ]}
        />

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          // Skip profile tab (it's in the header now)
          if (hiddenTabs.includes(route.name)) {
            return null;
          }

          const isFocused = state.index === index;
          const label = getLabel(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused
            ? theme.tabBar.activeTint
            : theme.tabBar.inactiveTint;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [
                      {
                        scale: isFocused ? 1 : 0.95,
                      },
                    ],
                  },
                ]}
              >
                {getIcon(route.name, color, 24)}
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color,
                      opacity: isFocused ? 1 : 0.7,
                      fontWeight: isFocused ? '600' : '500',
                    },
                  ]}
                >
                  {label}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 35,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  activeIndicator: {
    position: 'absolute',
    width: TAB_WIDTH - 8,
    height: 54,
    borderRadius: 27,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'SFProDisplayMedium',
  },
});

export default FloatingTabBar;
