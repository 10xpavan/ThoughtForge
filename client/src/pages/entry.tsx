import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Entry } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function EntryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createEntry = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/entries", { title, content });
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

  return (
    <Shell>
      <div className="max-w-3xl mx-auto space-y-6">
        <Input
          type="text"
          placeholder="Entry title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold"
        />

        <Editor
          content={content}
          onChange={setContent}
          className="min-h-[60vh]"
        />

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Cancel
          </Button>
          <Button
            onClick={() => createEntry.mutate()}
            disabled={!title || !content || createEntry.isPending}
          >
            Save Entry
          </Button>
        </div>
      </div>
    </Shell>
  );
}
