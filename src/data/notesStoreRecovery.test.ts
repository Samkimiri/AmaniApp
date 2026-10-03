import AsyncStorage from "@react-native-async-storage/async-storage";
import { notesStore } from "./notesStore";
import { newId, SermonNote } from "@/types/note";

const LIVE_KEY = "amani.notes.v1";
const BACKUP_KEY = "amani.notes.backup.v1";
const QUARANTINE_KEY = "amani.notes.quarantine.v1";

function makeNote(overrides: Partial<SermonNote> = {}): SermonNote {
  return {
    id: newId(),
    title: "Note",
    date: "Sun, Jan 1",
    blocks: [{ id: newId(), type: "text", text: "Hello" }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * These cover the failure that actually lost people's notes: a stored
 * payload the app couldn't read being treated as "no notes", so the next
 * save wrote that empty result back over everything. A payload that can't
 * be parsed must instead be recovered — never silently emptied.
 */
describe("notesStore recovery", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("recovers a note from a payload that no longer parses as one document", async () => {
    const kept = makeNote({ id: "kept", title: "Sermon on the mount" });
    // A truncated array — the note object is whole, the JSON around it isn't.
    await AsyncStorage.setItem(LIVE_KEY, `[${JSON.stringify(kept)},`);

    expect((await notesStore.getAll()).map((n) => n.title)).toEqual(["Sermon on the mount"]);
  });

  it("quarantines an unreadable payload verbatim so its bytes are never discarded", async () => {
    const raw = '[{"id":"a","title":"Half-written';
    await AsyncStorage.setItem(LIVE_KEY, raw);

    await notesStore.getAll();

    expect(await AsyncStorage.getItem(QUARANTINE_KEY)).toBe(raw);
  });

  it("restores notes from the last known-good copy when the live payload is destroyed", async () => {
    await notesStore.save(makeNote({ id: "a", title: "Saved earlier" }));
    expect(await AsyncStorage.getItem(BACKUP_KEY)).not.toBeNull();

    await AsyncStorage.setItem(LIVE_KEY, "{ not json at all");

    expect((await notesStore.getAll()).map((n) => n.title)).toEqual(["Saved earlier"]);
  });

  it("saving over a damaged store keeps the notes it could still recover", async () => {
    const recoverable = makeNote({ id: "old", title: "From before the update" });
    await AsyncStorage.setItem(LIVE_KEY, `[${JSON.stringify(recoverable)}`); // no closing ]

    await notesStore.save(makeNote({ id: "new", title: "Written after" }));

    expect((await notesStore.getAll()).map((n) => n.id).sort()).toEqual(["new", "old"]);
  });

  it("deleting a note from a damaged store doesn't take the others with it", async () => {
    const recoverable = makeNote({ id: "old", title: "Still here" });
    await AsyncStorage.setItem(LIVE_KEY, `[${JSON.stringify(recoverable)}`);

    await notesStore.remove("some-other-id");

    expect((await notesStore.getAll()).map((n) => n.id)).toEqual(["old"]);
  });

  it("upgrades notes saved in an older shape and persists the upgrade", async () => {
    // No id on the note or on its block, and a block type the app no longer
    // defines — but the text is still there and must not be lost.
    await AsyncStorage.setItem(
      LIVE_KEY,
      JSON.stringify([
        {
          title: "Legacy",
          date: "Sun, Jan 1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          blocks: [{ type: "paragraph", content: "Keep this sentence" }],
        },
      ])
    );

    const [note] = await notesStore.getAll();
    expect(note.title).toBe("Legacy");
    expect(note.id).toBeTruthy();
    expect(note.blocks).toEqual([
      { id: expect.any(String), type: "text", text: "Keep this sentence" },
    ]);

    // The upgraded shape is written back, so the id is stable from now on.
    const stored = JSON.parse((await AsyncStorage.getItem(LIVE_KEY)) as string);
    expect(stored[0].id).toBe(note.id);
  });

  it("still reports a genuinely empty store as empty", async () => {
    await notesStore.save(makeNote({ id: "a" }));
    await notesStore.remove("a");

    expect(await AsyncStorage.getItem(LIVE_KEY)).toBe("[]");
    expect(await notesStore.getAll()).toEqual([]);
  });
});
