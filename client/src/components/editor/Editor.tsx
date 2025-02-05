import { useEditor, EditorContent } from "@tiptap/react";
import { extensions } from "./Extensions";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export function Editor({ content, onChange, className }: EditorProps) {
  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className={`min-h-[300px] rounded-md border p-4 ${className}`}>
      <EditorContent editor={editor} />
    </div>
  );
}
