import { useMemo } from 'react';
import { tabBarStyles } from '@/lib/styles/layout/tab-bar.styles';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeSvg from '@/assets/svgs/home.svg';
import CallSvg from '@/assets/svgs/call.svg';
import ChatSvg from '@/assets/svgs/chat.svg';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabBar.activeTint,
        tabBarInactiveTintColor: theme.tabBar.inactiveTint,
        headerShown: false,
        sceneStyle: tabBarStyles.sceneStyle,
        tabBarStyle: {
          ...tabBarStyles.container,
          backgroundColor: theme.tabBar.background,
          borderTopColor: theme.tabBar.borderColor,
          borderTopWidth: 1,
          height: tabBarStyles.container.height as number + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: tabBarStyles.label,
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              tabBarStyles.iconContainer,
              focused
                ? { ...tabBarStyles.iconContainerActive, backgroundColor: theme.tabBar.activeBackground }
                : tabBarStyles.iconContainerInactive
            ]}>
              <HomeSvg
                width={tabBarStyles.iconSize}
                height={tabBarStyles.iconSize}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              tabBarStyles.iconContainer,
              focused
                ? { ...tabBarStyles.iconContainerActive, backgroundColor: theme.tabBar.activeBackground }
                : tabBarStyles.iconContainerInactive
            ]}>
              <ChatSvg
                width={tabBarStyles.iconSize}
                height={tabBarStyles.iconSize}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              tabBarStyles.iconContainer,
              focused
                ? { ...tabBarStyles.iconContainerActive, backgroundColor: theme.tabBar.activeBackground }
                : tabBarStyles.iconContainerInactive
            ]}>
              <CallSvg
                width={tabBarStyles.iconSize}
                height={tabBarStyles.iconSize}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
