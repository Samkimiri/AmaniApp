import AsyncStorage from "@react-native-async-storage/async-storage";
import { notesStore } from "./notesStore";
import { newId, SermonNote } from "@/types/note";

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

describe("notesStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("saves, reads back by id, and lists every note", async () => {
    await notesStore.save(makeNote({ id: "a" }));
    await notesStore.save(makeNote({ id: "b" }));
    expect(await notesStore.getById("a")).toMatchObject({ id: "a" });
    expect(await notesStore.getAll()).toHaveLength(2);
  });

  it("updates an existing note rather than duplicating it", async () => {
    await notesStore.save(makeNote({ id: "a", title: "First" }));
    await notesStore.save(makeNote({ id: "a", title: "Second" }));
    const all = await notesStore.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("Second");
  });

  it("returns newest-updated first", async () => {
    await notesStore.save(makeNote({ id: "old", updatedAt: "2026-01-01T00:00:00.000Z" }));
    await notesStore.save(makeNote({ id: "new", updatedAt: "2026-06-01T00:00:00.000Z" }));
    expect((await notesStore.getAll()).map((n) => n.id)).toEqual(["new", "old"]);
  });

  it("survives two writes racing — neither note is lost", async () => {
    // Each write is a read-modify-write of the whole array; without the
    // store's internal queue these two could read the same snapshot and the
    // second would silently drop the first.
    await Promise.all([notesStore.save(makeNote({ id: "a" })), notesStore.save(makeNote({ id: "b" }))]);
    expect((await notesStore.getAll()).map((n) => n.id).sort()).toEqual(["a", "b"]);
  });

  it("remove deletes the note", async () => {
    await notesStore.save(makeNote({ id: "a" }));
    await notesStore.remove("a");
    expect(await notesStore.getAll()).toEqual([]);
  });

  it("starts fresh instead of throwing on corrupt stored data", async () => {
    await AsyncStorage.setItem("amani.notes.v1", "{not json");
    expect(await notesStore.getAll()).toEqual([]);
  });
});