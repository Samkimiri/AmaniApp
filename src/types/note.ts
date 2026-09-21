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
  /** Live-captioned while recording, on-device, via the OS's speech
   * recognizer — native only (iOS/Android); undefined for recordings
   * made on web, or if recognition wasn't available or permitted. Never
   * sent anywhere: this is the same on-device engine iOS/Android already
   * use for dictation, not a cloud transcription call. */
  transcript?: string;
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
      if (block.transcript) lines.push(block.transcript);
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
      ? `<div style="margin-top:8px;font-size:17px;color:#8A5A00;">${note.tags.map((t) => `#${escapeHtml(t)}`).join("&nbsp;&nbsp;")}</div>`
      : "";
  const body = note.blocks
    .map((block) => {
      if (block.type === "text" && block.text.trim()) {
        return `<p style="font-size:22px;line-height:1.65;color:#1F2933;margin:0 0 14px;">${renderMarkdownLite(block.text)}</p>`;
      }
      if (block.type === "heading" && block.text.trim()) {
        return `<h2 style="font-size:26px;font-weight:800;color:#182233;margin:30px 0 8px;">${escapeHtml(
          block.text
        )}</h2>`;
      }
      if (block.type === "verse") {
        const c = getHighlightColor(block.color);
        return `<blockquote style="background:${c.background};border-left:3px solid ${c.accent};margin:22px 0;padding:18px 22px;border-radius:10px;">
          <div style="font-size:16px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${c.accent};">${escapeHtml(
            block.reference
          )}</div>
          <div style="font-style:italic;font-size:21px;line-height:1.55;color:${c.text};margin-top:6px;">&ldquo;${escapeHtml(
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
        const transcriptHtml = block.transcript
          ? `<div style="margin-top:8px;font-size:19px;line-height:1.55;font-style:italic;color:#1F2933;">${escapeHtml(
              block.transcript
            )}</div>`
          : "";
        return `<div style="margin:18px 0;padding:14px 18px;border:1px solid #ECE4D4;border-radius:8px;color:#3E4856;font-size:18px;">&#127911; Audio recording &middot; ${escapeHtml(
          formatDuration(block.durationMillis)
        )}${transcriptHtml}</div>`;
      }
      return "";
    })
    .join("\n");

  return `<!doctype html>
  <html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body style="font-family:Georgia,'Times New Roman',serif;padding:40px 44px;color:#182233;line-height:1.5;">
    <h1 style="font-size:38px;line-height:1.2;margin:0 0 8px;">${escapeHtml(note.title || "Untitled note")}</h1>
    <div style="font-size:18px;color:#4B5563;">${meta}</div>
    ${tagsLine}
    <div style="margin-bottom:20px;"></div>
    ${body}
    <div style="margin-top:44px;font-size:15px;color:#6B7280;">Shared from Amani</div>
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

/**
 * A tiny, deliberately minimal Markdown renderer for the note editor's
 * lightweight rich text: **bold**, *italic*, ==highlight==, and "- "
 * bullet lines. Not a general Markdown implementation — just the handful
 * of markers the editor's formatting toolbar actually inserts. Escapes
 * HTML first, then applies formatting to the now-safe text, so no
 * user-typed text can break out of the tags this generates.
 */
function renderMarkdownLite(text: string): string {
  const highlight = getHighlightColor("gold");
  const escaped = escapeHtml(text)
    .replace(
      /==(.+?)==/g,
      `<mark style="background:${highlight.background};color:${highlight.text};padding:0 2px;border-radius:2px;">$1</mark>`
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  const lines = escaped.split("\n");
  let html = "";
  let inList = false;
  for (const line of lines) {
    const bullet = line.match(/^-\s+(.*)/);
    if (bullet) {
      if (!inList) {
        html += '<ul style="margin:6px 0;padding-left:20px;">';
        inList = true;
      }
      html += `<li>${bullet[1]}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `${line}<br/>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}
