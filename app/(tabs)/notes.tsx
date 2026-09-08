import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { textStyles } from "@/theme/typography";
import { NoteCard } from "@/components/NoteCard";
import { useNotes } from "@/hooks/useNotes";

export default function NotesScreen() {
  const { notes } = useNotes();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={textStyles.screenTitle}>Your notes</Text>
      </View>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => router.push(`/note/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Notes you take during a sermon will show up here, saved automatically on this device.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  list: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  empty: { paddingVertical: 40 },
  emptyText: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 20, textAlign: "center" },
});
