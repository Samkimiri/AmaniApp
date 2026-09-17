import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
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
      {render(color)}
      <Text style={[styles.tabLabel, { color, fontFamily: focused ? fontFamily.sansBold : fontFamily.sansSemibold }]}>
        {label}
      </Text>
      {focused ? <View style={styles.dot} /> : null}
    </View>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const styles = makeStyles(colors);

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

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 84,
      paddingTop: 6,
    },
    tabItem: {
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      minHeight: 44,
    },
    tabLabel: {
      fontSize: 10.5,
    },
    dot: {
      position: "absolute",
      bottom: -8,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.gold,
    },
  });
}
