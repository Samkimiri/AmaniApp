import { NoteBlock, newId } from "@/types/note";

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  /** A fresh set of blocks each time — never share one array instance
   * across notes, since blocks carry their own ids and get mutated. */
  buildBlocks: () => NoteBlock[];
}

function textBlock(): NoteBlock {
  return { id: newId(), type: "text", text: "" };
}

function headingBlock(text: string): NoteBlock {
  return { id: newId(), type: "heading", text };
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start with a single empty note",
    buildBlocks: () => [textBlock()],
  },
  {
    id: "three-point",
    name: "Three-point sermon",
    description: "Introduction, three points, and application",
    buildBlocks: () => [
      headingBlock("Introduction"),
      textBlock(),
      headingBlock("Point 1"),
      textBlock(),
      headingBlock("Point 2"),
      textBlock(),
      headingBlock("Point 3"),
      textBlock(),
      headingBlock("Application"),
      textBlock(),
    ],
  },
  {
    id: "expository",
    name: "Expository study",
    description: "Passage, observation, interpretation, application",
    buildBlocks: () => [
      headingBlock("Passage & Context"),
      textBlock(),
      headingBlock("Observation — what does it say?"),
      textBlock(),
      headingBlock("Interpretation — what does it mean?"),
      textBlock(),
      headingBlock("Application — what do I do about it?"),
      textBlock(),
    ],
  },
  {
    id: "testimony",
    name: "Testimony / life group",
    description: "A lighter structure for sharing or small-group discussion",
    buildBlocks: () => [
      headingBlock("What happened"),
      textBlock(),
      headingBlock("What I'm learning"),
      textBlock(),
      headingBlock("Questions for the group"),
      textBlock(),
    ],
  },
];

export function getNoteTemplate(id: string | undefined): NoteTemplate {
  return NOTE_TEMPLATES.find((t) => t.id === id) ?? NOTE_TEMPLATES[0];
}
