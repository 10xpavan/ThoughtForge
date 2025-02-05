import { X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { useState, useRef, useEffect } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function TagInput({ tags, onChange, className = "" }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const trimmedInput = input.trim().toLowerCase();
    if (trimmedInput && !tags.includes(trimmedInput)) {
      onChange([...tags, trimmedInput]);
      setInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tags..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addTag}
          disabled={!input.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
