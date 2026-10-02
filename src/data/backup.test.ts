import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildBackupJson, importBackup } from "./backup";
import { notesStore } from "./notesStore";
import { newId, SermonNote } from "@/types/note";

const PHOTO_DATA_URI = "data:image/jpeg;base64,AAAA";

function makeNote(overrides: Partial<SermonNote> = {}): SermonNote {
  return {
    id: newId(),
    title: "Sunday service",
    church: "Grace Chapel",
    preacher: "Pastor Jane",
    date: "Sun, Jan 1",
    blocks: [
      { id: newId(), type: "text", text: "Introduction" },
      { id: newId(), type: "verse", reference: "John 3:16", text: "For God so loved the world" },
      { id: newId(), type: "image", uri: PHOTO_DATA_URI, caption: "Slide 1" },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("backup export", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("wraps every note in one versioned, app-tagged file", async () => {
    await notesStore.save(makeNote());
    await notesStore.save(makeNote({ title: "Evening service" }));

    const file = JSON.parse(await buildBackupJson());
    expect(file.app).toBe("amani-backup");
    expect(file.version).toBe(1);
    expect(file.notes).toHaveLength(2);
    expect(typeof file.exportedAt).toBe("string");
  });

  it("embeds photos as self-contained data: URIs so the file stands alone", async () => {
    // A photo in a live note is a *reference* (IndexedDB / a file path), which
    // a plain JSON file can't dereference. The export has to carry the bytes.
    await notesStore.save(makeNote());

    const file = JSON.parse(await buildBackupJson());
    const image = file.notes[0].blocks.find((b: { type: string }) => b.type === "image");
    expect(image.uri.startsWith("data:image/")).toBe(true);
    expect(image.caption).toBe("Slide 1");
  });
});

describe("backup import", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("round-trips: a backup restored onto a fresh device brings every note back", async () => {
    await notesStore.save(makeNote({ title: "Morning" }));
    await notesStore.save(makeNote({ title: "Evening" }));
    const json = await buildBackupJson();

    await AsyncStorage.clear(); // a new device, or storage cleared
    expect(await notesStore.getAll()).toHaveLength(0);

    const result = await importBackup(json);
    expect(result).toEqual({ imported: 2, failed: 0 });

    const restored = await notesStore.getAll();
    expect(restored.map((n) => n.title).sort()).toEqual(["Evening", "Morning"]);
    const image = restored[0].blocks.find((b) => b.type === "image");
    expect(image).toBeDefined();
    if (image && image.type === "image") {
      // Either still a data: URI (no writable storage available) or moved
      // into durable storage — but never dropped or left empty.
      expect(image.uri.length).toBeGreaterThan(0);
    }
  });

  it("restores the same backup twice without duplicating notes", async () => {
    await notesStore.save(makeNote());
    const json = await buildBackupJson();
    await importBackup(json);
    await importBackup(json);
    expect(await notesStore.getAll()).toHaveLength(1);
  });

  it("rejects something that isn't JSON at all", async () => {
    await expect(importBackup("not json")).rejects.toThrow(/valid JSON/);
  });

  it("rejects JSON that isn't an Amani backup", async () => {
    await expect(importBackup(JSON.stringify({ hello: "world" }))).rejects.toThrow(/Amani backup/);
  });

  it("keeps the notes it can read and counts the ones it can't", async () => {
    const good = makeNote({ id: "good", title: "Readable" });
    // `blocks` isn't an array — the per-note guard should skip this one
    // rather than aborting the whole restore.
    const broken = { id: "broken", title: "Broken", blocks: 5 };
    const result = await importBackup(
      JSON.stringify({ app: "amani-backup", version: 1, exportedAt: "", notes: [good, broken] })
    );
    expect(result).toEqual({ imported: 1, failed: 1 });
    expect((await notesStore.getAll()).map((n) => n.title)).toEqual(["Readable"]);
  });
});