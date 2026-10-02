import { noteToHtml, SermonNote } from "@/types/note";
import { exportImageAsDataUrl } from "@/data/imageStorage";

/**
 * `noteToHtml` with every photo resolved to a self-contained `data:` URI.
 *
 * A note only stores a reference to its photos (IndexedDB on web, a file
 * path on native), and neither a printed page nor a generated PDF can load
 * one of those. Resolving first is what makes the PDF/print export actually
 * show the note's photos. A photo that can't be read is left as-is rather
 * than failing the whole export.
 */
export async function noteToHtmlWithMedia(note: SermonNote): Promise<string> {
  const resolvedImages: Record<string, string> = {};
  await Promise.all(
    note.blocks.map(async (block) => {
      if (block.type !== "image") return;
      try {
        resolvedImages[block.id] = await exportImageAsDataUrl(block.uri);
      } catch {
        // leave this block's own uri in place
      }
    })
  );
  return noteToHtml(note, resolvedImages);
}