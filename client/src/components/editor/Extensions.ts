import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "Start writing your thoughts...",
    emptyEditorClass: "is-editor-empty",
  }),
];
