import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { notesStore } from "@/data/notesStore";
import { SermonNote } from "@/types/note";

/** Loads all notes and refreshes whenever the screen regains focus.
 *
 * `useFocusEffect` also runs on the initial mount of a focused screen, so
 * this deliberately doesn't *also* kick off a plain `useEffect` load — doing
 * both meant every screen using this hook read the whole notes store twice
 * on open. */
export function useNotes() {
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const all = await notesStore.getAll();
    setNotes(all);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { notes, loading, reload };
}
