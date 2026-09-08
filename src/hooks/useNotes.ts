import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { notesStore } from "@/data/notesStore";
import { SermonNote } from "@/types/note";

/** Loads all notes and refreshes whenever the screen regains focus. */
export function useNotes() {
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const all = await notesStore.getAll();
    setNotes(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { notes, loading, reload };
}
