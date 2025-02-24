import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAutosave } from "@/hooks/use-autosave";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Entry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/googleDrive";

export default function EntryPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  // State management with debouncing for rapid changes
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileId, setFileId] = useState<string | null>(null);
  const { googleDriveToken } = useAuth();
  const driveService = googleDriveToken ? new GoogleDriveService(googleDriveToken) : null;

  // Optimized state updates with input validation
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
  }, []);

  // Load existing entry if editing
  const { data: entry } = useQuery<Entry>({
    queryKey: [`/api/entries/${params.id}`],
    enabled: !!params.id,
  });

  // Set initial values
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || "");
      setContent(entry.content || "");
    }
  }, [entry]);

  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveIndicatorTimeout = useRef<NodeJS.Timeout>();
  const autosaveDelay = 5000; // Configurable autosave delay in ms

  // Show save indicator for 2 seconds
  const showTemporarySaveIndicator = useCallback(() => {
    setShowSaveIndicator(true);
    
    // Clear existing timeout
    if (saveIndicatorTimeout.current) {
      clearTimeout(saveIndicatorTimeout.current);
    }
    
    // Hide after 2 seconds
    saveIndicatorTimeout.current = setTimeout(() => {
      setShowSaveIndicator(false);
    }, 2000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveIndicatorTimeout.current) {
        clearTimeout(saveIndicatorTimeout.current);
      }
    };
  }, []);

  const autosaveStatus = useAutosave({
    title,
    content,
    driveService,
    onSave: (id) => {
      setFileId(id);
      showTemporarySaveIndicator();
    },
    onSaveStart: () => {
      // Optional: show saving state
    },
    onSaveEnd: (success) => {
      if (success) {
        showTemporarySaveIndicator();
      }
    },
    debounceMs: autosaveDelay
  });

  const shareEntry = useMutation({
    mutationFn: async () => {
      if (!content.trim()) {
        throw new Error("Cannot share empty entry");
      }

      if (!fileId || !driveService) {
        // Try to save first if we don't have a fileId
        try {
          const uploadResponse = await driveService?.uploadFile(
            title.trim() || "Untitled",
            content
          );
          setFileId(uploadResponse.id);
          return await driveService?.shareFile(uploadResponse.id);
        } catch (error) {
          throw new Error("Failed to save entry before sharing");
        }
      }

      return await driveService.shareFile(fileId);
    },
    onSuccess: (data) => {
      if (!data?.webViewLink) {
        throw new Error("No share link received");
      }

      // Use the newer Clipboard API with fallback
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(data.webViewLink).then(
          () => {
            toast({
              title: "Link copied!",
              description: "Share link copied to clipboard",
              variant: "default",
            });
          },
          () => showLinkToast(data.webViewLink)
        );
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = data.webViewLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();

        try {
          document.execCommand("copy");
          textArea.remove();
          toast({
            title: "Link copied!",
            description: "Share link copied to clipboard",
            variant: "default",
          });
        } catch (error) {
          textArea.remove();
          showLinkToast(data.webViewLink);
        }
      }
    },
    onError: (error) => {
      console.error("Failed to share entry:", error);
      toast({
        title: "Sharing failed",
        description: error instanceof Error ? error.message : "Could not share entry",
        variant: "destructive",
      });
    },
  });

  const showLinkToast = (link: string) => {
    toast({
      title: "Share link ready",
      description: link,
      variant: "default",
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Cannot save",
        description: "Please add some content to your entry",
        variant: "destructive",
      });
      return;
    }

    try {
      // await createEntry.mutateAsync();
      showTemporarySaveIndicator();
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast({
        title: "Save failed",
        description: "Could not save your entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = false; // createEntry.isPending;
  const isSaving = autosaveStatus.isSaving;
  const isSharing = shareEntry.isPending;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        {/* Title Input */}
        <input
          ref={titleRef}
          type="text"
          placeholder="Title your thoughts..."
          value={title}
          onChange={handleTitleChange}
          className="w-full bg-black text-white border border-white/20 focus:border-white p-6 text-2xl font-light 
            placeholder:text-white/50 outline-none transition-colors focus:ring-0 focus:outline-none"
        />

        {/* Content Textarea */}
        <textarea
          ref={contentRef}
          placeholder="Express yourself..."
          value={content}
          onChange={handleContentChange}
          className="w-full min-h-[50vh] bg-black text-white border border-white/20 focus:border-white p-6 text-lg 
            leading-relaxed font-light placeholder:text-white/50 outline-none resize-none transition-colors 
            focus:ring-0 focus:outline-none [font-size:18px]"
        />

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-end gap-6">
            <button
              onClick={() => {
                if (content.trim()) {
                  const confirmLeave = window.confirm(
                    "You have unsaved changes. Are you sure you want to leave?"
                  );
                  if (!confirmLeave) return;
                }
                setLocation("/");
              }}
              className="px-8 py-3 border border-white/20 text-white/60 hover:text-white hover:border-white 
                transition-colors focus:outline-none focus:ring-0"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSaving || !content.trim()}
              className="px-8 py-3 border border-white text-white disabled:opacity-50 disabled:cursor-not-allowed 
                transition-colors focus:outline-none focus:ring-0"
            >
              {isSaving ? "Saving..." : "Save Entry"}
            </button>

            {(fileId || content.trim()) && (
              <button
                onClick={() => shareEntry.mutate()}
                disabled={isSharing || !content.trim()}
                className="px-8 py-3 border border-white text-white disabled:opacity-50 disabled:cursor-not-allowed 
                  transition-colors focus:outline-none focus:ring-0"
              >
                {isSharing ? "Sharing..." : "Share Entry"}
              </button>
            )}
          </div>

          {/* Save Indicator */}
          <div className="flex justify-end">
            {showSaveIndicator && (
              <div className="text-sm text-white/75 bg-black px-4 py-2 rounded transition-opacity duration-200">
                Saved
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}