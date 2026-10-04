import React, { useMemo } from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors, useShadows } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import { radius, Shadows } from "@/theme/tokens";
import { HomeIcon, NotesIcon, OpenBookIcon, SettingsIcon } from "@/components/icons";

function TabIcon({
  focused,
  label,
  render,
  colors,
  styles,
}: {
  focused: boolean;
  label: string;
  render: (color: string) => React.ReactNode;
  colors: ColorPalette;
  styles: ReturnType<typeof makeStyles>;
}) {
  const color = focused ? colors.navy : colors.textFaint;
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>{render(color)}</View>
      <Text style={[styles.tabLabel, { color, fontFamily: focused ? fontFamily.sansBold : fontFamily.sansSemibold }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const shadows = useShadows();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { height: 68 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Home"
              render={(c) => <HomeIcon size={22} color={c} />}
              colors={colors}
              styles={styles}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Notes"
              render={(c) => <NotesIcon size={22} color={c} />}
              colors={colors}
              styles={styles}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: "Bible",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Bible"
              render={(c) => <OpenBookIcon size={22} color={c} />}
              colors={colors}
              styles={styles}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Settings"
              render={(c) => <SettingsIcon size={22} color={c} />}
              colors={colors}
              styles={styles}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function makeStyles(colors: ColorPalette, shadows: Shadows) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.card,
      borderTopColor: colors.borderLight,
      borderTopWidth: 1,
      height: 84,
      paddingTop: 6,
      ...shadows.top,
    },
    tabItem: {
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      minHeight: 48,
    },
    // The focused tab gets a soft pill behind its icon — a clearer "you are
    // here" than a small dot, without turning the bar into a row of buttons.
    iconPill: {
      width: 54,
      height: 30,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    iconPillActive: { backgroundColor: colors.verseBg },
    tabLabel: {
      fontSize: 10.5,
    },
  });
}
