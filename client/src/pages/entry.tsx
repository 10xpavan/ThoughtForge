import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { Star } from "lucide-react";
import { VoiceInput } from "@/components/ui/voice-input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Entry } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function EntryPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load existing entry if editing
  const { data: entry } = useQuery<Entry>({
    queryKey: [`/api/entries/${params.id}`],
    enabled: !!params.id,
  });

  // Load template if creating from template
  const templateId = new URLSearchParams(window.location.search).get("template");
  const { data: template } = useQuery({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId,
  });

  // Set initial values
  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setTags(entry.tags);
      setIsFavorite(entry.isFavorite);
    } else if (template) {
      setTitle("");
      setContent(template.content);
      setTags([]);
      setIsFavorite(false);
    }
  }, [entry, template]);

  const createEntry = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/entries", {
        title,
        content,
        tags,
        isFavorite,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved successfully.",
      });
      setLocation("/");
    },
  });

  const updateEntry = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/entries/${params.id}`, {
        title,
        content,
        tags,
        isFavorite,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      toast({
        title: "Entry updated",
        description: "Your journal entry has been updated successfully.",
      });
      setLocation("/");
    },
  });

  const handleSubmit = () => {
    if (params.id) {
      updateEntry.mutate();
    } else {
      createEntry.mutate();
    }
  };

  const isLoading = createEntry.isPending || updateEntry.isPending;

  return (
    <Shell>
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Entry title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium h-10 flex-1"
          />
          <VoiceInput onTranscript={(text) => setContent(content + text)} />
          <Button
            size="icon"
            variant={isFavorite ? "default" : "ghost"}
            className="h-10 w-10"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>

        <TagInput tags={tags} onChange={setTags} />

        <Editor
          content={content}
          onChange={setContent}
          className="min-h-[40vh]"
        />

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!title || !content || isLoading}
          >
            {params.id ? "Update" : "Save"} Entry
          </Button>
        </div>
      </div>
    </Shell>
  );
}