import React from "react";
import { StyleProp, Text, TextStyle, View } from "react-native";
import { fontFamily } from "@/theme/typography";
import { getHighlightColor } from "@/theme/highlightColors";

// Same three markers, same precedence, as renderMarkdownLite in
// src/types/note.ts (which produces the HTML for PDF/print export) —
// this is the same "==highlight==" wins over "**bold**" wins over
// "*italic*" ordering, just rendered as native <Text> spans instead of
// HTML, so it also works live in the editor. Highlight is tried first so
// a bold word *inside* a highlighted phrase still gets its own nested
// bold span; italic is tried last, and (unlike a simple "any *...*"
// pattern) never matches into a "**bold**" pair, since by the time the
// scanner reaches an italic candidate every "**...**" run has already
// been consumed as a single token starting at the first "*".
const TOKEN_RE = /==(.+?)==|\*\*(.+?)\*\*|\*(.+?)\*/g;

function renderInlineSpans(line: string, keyBase: string, baseStyle: StyleProp<TextStyle>): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(line))) {
    if (match.index > lastIndex) {
      nodes.push(
        <Text key={`${keyBase}-${i++}`} style={baseStyle}>
          {line.slice(lastIndex, match.index)}
        </Text>
      );
    }
    if (match[1] !== undefined) {
      const hl = getHighlightColor("gold");
      nodes.push(
        <Text key={`${keyBase}-${i++}`} style={[baseStyle, { backgroundColor: hl.background, color: hl.text }]}>
          {match[1]}
        </Text>
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <Text key={`${keyBase}-${i++}`} style={[baseStyle, { fontFamily: fontFamily.sansExtraBold }]}>
          {match[2]}
        </Text>
      );
    } else {
      nodes.push(
        <Text key={`${keyBase}-${i++}`} style={[baseStyle, { fontFamily: fontFamily.serifItalic, fontStyle: "italic" }]}>
          {match[3]}
        </Text>
      );
    }
    lastIndex = TOKEN_RE.lastIndex;
  }
  if (lastIndex < line.length || nodes.length === 0) {
    nodes.push(
      <Text key={`${keyBase}-${i++}`} style={baseStyle}>
        {line.slice(lastIndex)}
      </Text>
    );
  }
  return nodes;
}

/**
 * Renders a text block's stored markdown-lite (**bold**, *italic*,
 * ==highlight==, "- " bullets) as actually-styled text, the same markup
 * the PDF/share export already turns into real HTML. A plain
 * `TextInput` can't show mixed formatting within itself — its `value`
 * is one uniformly-styled string — so the editor shows this read-only
 * rendering for a paragraph while it isn't the one being typed into,
 * and swaps to the raw editable text (asterisks and all) only for the
 * block currently focused. Tapping a rendered paragraph hands it back
 * to the caller to re-enter edit mode.
 */
export function MarkdownPreview({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  const lines = text.split("\n");
  return (
    <View>
      {lines.map((line, idx) => {
        const bullet = line.match(/^-\s+(.*)/);
        if (bullet) {
          return (
            <View key={idx} style={{ flexDirection: "row", gap: 6 }}>
              <Text style={style}>{"•"}</Text>
              <Text style={[style, { flex: 1 }]}>{renderInlineSpans(bullet[1], `${idx}`, style)}</Text>
            </View>
          );
        }
        return (
          <Text key={idx} style={style}>
            {line.length > 0 ? renderInlineSpans(line, `${idx}`, style) : " "}
          </Text>
        );
      })}
    </View>
  );
}
