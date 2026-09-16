import { getHighlightColor } from "@/theme/highlightColors";

export type NoteBlockType = "text" | "heading" | "verse" | "image" | "audio";

export interface TextBlock {
  id: string;
  type: "text";
  text: string;
}

/** A subheading within the note body — e.g. to break a long sermon note
 * into sections ("Introduction", "Point 1", "Application"). */
export interface HeadingBlock {
  id: string;
  type: "heading";
  text: string;
}

export interface VerseBlock {
  id: string;
  type: "verse";
  reference: string; // e.g. "2 Corinthians 5:7"
  text: string;
  /** Highlight color id for this callout's background (see
   * src/theme/highlightColors.ts) — undefined means the default (gold). */
  color?: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  uri: string;
  caption?: string;
}

export interface AudioBlock {
  id: string;
  type: "audio";
  uri: string;
  durationMillis: number;
}

export type NoteBlock = TextBlock | HeadingBlock | VerseBlock | ImageBlock | AudioBlock;

export function firstAudioBlock(note: SermonNote): AudioBlock | undefined {
  return note.blocks.find((b): b is AudioBlock => b.type === "audio");
}

export function formatDuration(millis: number): string {
  const totalSeconds = Math.max(0, Math.round(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export interface SermonNote {
  id: string;
  title: string;
  church?: string;
  preacher?: string;
  tags?: string[];
  /** ISO date string for the service this note belongs to */
  date: string;
  blocks: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** First verse block in a note, if any — used for previews and the share card. */
export function firstVerseBlock(note: SermonNote): VerseBlock | undefined {
  return note.blocks.find((b): b is VerseBlock => b.type === "verse");
}

/** Plain-text rendering of a note, used for the "copy as text" share format. */
export function noteToPlainText(note: SermonNote): string {
  const lines: string[] = [];
  lines.push(note.title || "Untitled note");
  const meta = [note.church, note.preacher, note.date].filter(Boolean).join(" · ");
  if (meta) lines.push(meta);
  if (note.tags && note.tags.length > 0) lines.push(note.tags.map((t) => `#${t}`).join(" "));
  lines.push("");
  for (const block of note.blocks) {
    if (block.type === "text" && block.text.trim()) {
      lines.push(block.text.trim());
    } else if (block.type === "heading" && block.text.trim()) {
      lines.push("");
      lines.push(block.text.trim().toUpperCase());
    } else if (block.type === "verse") {
      lines.push(`"${block.text}" — ${block.reference}`);
    } else if (block.type === "image") {
      lines.push(`[Photo${block.caption ? `: ${block.caption}` : ""}]`);
    } else if (block.type === "audio") {
      lines.push(`[Audio recording, ${formatDuration(block.durationMillis)}]`);
    }
  }
  lines.push("");
  lines.push("Shared from Amani");
  return lines.join("\n");
}

/** Simple HTML rendering of a note, used for the PDF share format. */
export function noteToHtml(note: SermonNote): string {
  const meta = [note.church, note.preacher, note.date].filter(Boolean).join(" &middot; ");
  const tagsLine =
    note.tags && note.tags.length > 0
      ? `<div style="margin-top:4px;font-size:11px;color:#B8860B;">${note.tags.map((t) => `#${escapeHtml(t)}`).join("&nbsp;&nbsp;")}</div>`
      : "";
  const body = note.blocks
    .map((block) => {
      if (block.type === "text" && block.text.trim()) {
        return `<p style="font-size:15px;line-height:1.7;color:#333B45;">${escapeHtml(block.text)}</p>`;
      }
      if (block.type === "heading" && block.text.trim()) {
        return `<h2 style="font-size:17px;font-weight:800;color:#182233;margin:22px 0 6px;">${escapeHtml(
          block.text
        )}</h2>`;
      }
      if (block.type === "verse") {
        const c = getHighlightColor(block.color);
        return `<blockquote style="background:${c.background};border-left:3px solid ${c.accent};margin:16px 0;padding:12px 16px;border-radius:8px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${c.accent};">${escapeHtml(
            block.reference
          )}</div>
          <div style="font-style:italic;font-size:15px;color:${c.text};margin-top:4px;">&ldquo;${escapeHtml(
            block.text
          )}&rdquo;</div>
        </blockquote>`;
      }
      if (block.type === "image") {
        // Escaped like every other field here — normally a data: URI or a
        // local file path (neither ever legitimately contains `"` or `<`),
        // but a note can also arrive via Backup → Restore, which parses
        // arbitrary JSON from a user-picked file with no content
        // validation beyond its top-level shape. Without this, a crafted
        // `uri` in an imported backup could break out of the attribute
        // and inject a script that runs in this same origin when the
        // note is later shared as a PDF (web's print-to-PDF path renders
        // this HTML in a same-origin tab).
        return `<img src="${escapeHtml(block.uri)}" style="width:100%;border-radius:8px;margin:12px 0;" />`;
      }
      if (block.type === "audio") {
        return `<div style="margin:12px 0;padding:10px 14px;border:1px solid #ECE4D4;border-radius:8px;color:#5B6472;font-size:13px;">&#127911; Audio recording &middot; ${escapeHtml(
          formatDuration(block.durationMillis)
        )}</div>`;
      }
      return "";
    })
    .join("\n");

  return `<!doctype html>
  <html><head><meta charset="utf-8" /></head>
  <body style="font-family:-apple-system,Helvetica,Arial,sans-serif;padding:32px;color:#182233;">
    <h1 style="font-size:22px;margin-bottom:4px;">${escapeHtml(note.title || "Untitled note")}</h1>
    <div style="font-size:12px;color:#9AA3AE;">${meta}</div>
    ${tagsLine}
    <div style="margin-bottom:20px;"></div>
    ${body}
    <div style="margin-top:32px;font-size:11px;color:#B9C4D3;">Shared from Amani</div>
  </body></html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
