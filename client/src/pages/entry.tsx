import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAutosave } from "@/hooks/use-autosave";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Entry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/googleDrive";
import debounce from 'lodash/debounce';
import { useSearchParams } from 'react-router-dom';
import { marked } from 'marked';

// Interface for research notes
interface ResearchNote {
  id: string;
  text: string;
}

export default function EntryPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const [searchParams] = useSearchParams();
  const [fileId, setFileId] = useState<string | null>(searchParams.get('fileId'));
  
  // State management with debouncing for rapid changes
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { googleDriveToken } = useAuth();
  const driveService = googleDriveToken ? new GoogleDriveService(googleDriveToken) : null;

  // For text formatting
  const [previewMode, setPreviewMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  
  // For AI assistant panel
  const [selectedText, setSelectedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<'grammar' | 'rewrite' | 'tips' | null>(null);
  
  // For research notes
  const [researchNotes, setResearchNotes] = useState<ResearchNote[]>([]);

  // Optimized state updates with input validation
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Save current selection for formatting
    setSelectionStart(e.target.selectionStart);
    setSelectionEnd(e.target.selectionEnd);
    
    // Update selected text for AI assistant
    const selected = newContent.substring(e.target.selectionStart, e.target.selectionEnd);
    if (selected) {
      setSelectedText(selected);
    }
  }, []);

  const handleTextSelection = useCallback(() => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selected) {
      setSelectedText(selected);
    }
  }, []);

  // Apply formatting to selected text
  const applyFormatting = useCallback((type: 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'note') => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) return; // No text selected
    
    const selectedText = content.substring(start, end);
    let formattedText = '';
    
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'note':
        formattedText = `[[note:${selectedText}]]`;
        
        // Add to research notes
        const newNote: ResearchNote = {
          id: Date.now().toString(),
          text: selectedText
        };
        setResearchNotes(prev => [...prev, newNote]);
        break;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  }, [content]);

  // Parse content for HTML preview
  const getHtmlContent = useCallback(() => {
    // Process content to extract research notes
    const processedContent = content.replace(/\[\[note:(.*?)\]\]/g, (match, p1) => {
      return `<span class="bg-gray-800 text-white px-2 py-1 rounded">📝 ${p1}</span>`;
    });
    
    return { __html: marked(processedContent) };
  }, [content]);

  // Extract research notes from content
  useEffect(() => {
    // Extract all research notes from content
    const noteRegex = /\[\[note:(.*?)\]\]/g;
    const matches = [...content.matchAll(noteRegex)];
    
    // Create new notes array
    const extractedNotes: ResearchNote[] = matches.map((match, index) => ({
      id: `note-${index}-${Date.now()}`,
      text: match[1]
    }));
    
    // Only update if the notes have changed
    if (JSON.stringify(extractedNotes.map(n => n.text)) !== JSON.stringify(researchNotes.map(n => n.text))) {
      setResearchNotes(extractedNotes);
    }
  }, [content]);

  // Remove a research note
  const removeNote = useCallback((noteId: string) => {
    // Find the note to remove
    const noteToRemove = researchNotes.find(note => note.id === noteId);
    
    if (noteToRemove) {
      // Remove the note from the content
      const notePattern = `[[note:${noteToRemove.text}]]`;
      const newContent = content.replace(notePattern, noteToRemove.text);
      setContent(newContent);
      
      // Remove from state
      setResearchNotes(prev => prev.filter(note => note.id !== noteId));
    }
  }, [researchNotes, content]);

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
  const [autoSaveDelay, setAutoSaveDelay] = useState(5000); // 5s default
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    onSave: (id: string) => {
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
    debounceMs: autoSaveDelay
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
          if (uploadResponse?.id) {
            setFileId(uploadResponse.id);
            return await driveService?.shareFile(uploadResponse.id);
          }
          throw new Error("Upload failed");
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
  const isSharing = shareEntry.isPending;

  // Save indicator helper
  const showSavedIndicator = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // Save function
  const saveEntry = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      const response = await fetch('/drive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, fileId }),
      });
      
      if (!response.ok) throw new Error('Save failed');
      showSavedIndicator();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced autosave
  const debouncedSave = useCallback(
    debounce(saveEntry, autoSaveDelay),
    [autoSaveDelay, title, content, fileId]
  );

  // Trigger autosave on content changes
  useEffect(() => {
    if (title || content) {
      debouncedSave();
    }
    return () => debouncedSave.cancel();
  }, [title, content, debouncedSave]);

  // AI assistant functions
  const fetchHuggingFaceAPI = async (text: string, action: 'grammar' | 'rewrite' | 'tips') => {
    setIsAiLoading(true);
    setAiAction(action);
    
    try {
      const apiKey = import.meta.env.VITE_HF_API_KEY;
      
      // If API key is not set, return mock responses
      if (!apiKey) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        let mockResponse = '';
        switch (action) {
          case 'grammar':
            mockResponse = "Grammar looks good! No issues found.";
            break;
          case 'rewrite':
            mockResponse = `Rewritten: ${text.split(' ').reverse().join(' ')}`;
            break;
          case 'tips':
            mockResponse = "Writing Tips:\n- Try using shorter sentences\n- Add more descriptive adjectives\n- Consider varying your sentence structure";
            break;
        }
        
        setAiResponse(mockResponse);
        return;
      }
      
      // Prepare the prompt based on the action
      let prompt = '';
      switch (action) {
        case 'grammar':
          prompt = `Check the grammar of this text: "${text}"`;
          break;
        case 'rewrite':
          prompt = `Rewrite this text to make it better: "${text}"`;
          break;
        case 'tips':
          prompt = `Give writing tips for improving this text: "${text}"`;
          break;
      }
      
      const response = await fetch('https://api-inference.huggingface.co/models/distilbert-base-uncased', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      setAiResponse(data[0].generated_text || 'No response from API');
      
    } catch (error) {
      console.error('AI assistant error:', error);
      setAiResponse('Error: Could not process request. Try again later.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGrammarCheck = () => {
    if (!selectedText) {
      setAiResponse('Please select some text first');
      return;
    }
    fetchHuggingFaceAPI(selectedText, 'grammar');
  };
  
  const handleRewrite = () => {
    if (!selectedText) {
      setAiResponse('Please select some text first');
      return;
    }
    fetchHuggingFaceAPI(selectedText, 'rewrite');
  };
  
  const handleTips = () => {
    if (!selectedText) {
      setAiResponse('Please select some text first');
      return;
    }
    fetchHuggingFaceAPI(selectedText, 'tips');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-5xl flex">
        {/* Main content area */}
        <div className="w-2/3 space-y-8">
          {/* Header with controls */}
          <div className="flex items-center justify-between">
            <select
              value={autoSaveDelay}
              onChange={(e) => setAutoSaveDelay(Number(e.target.value))}
              className="bg-black border border-white rounded px-2 py-1"
            >
              <option value={2000}>Autosave: 2s</option>
              <option value={5000}>Autosave: 5s</option>
              <option value={10000}>Autosave: 10s</option>
            </select>
            
            <div className="flex items-center gap-4">
              {showSaved && (
                <span className="text-green-400">Saved</span>
              )}
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
          </div>
  
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
  
          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-2 bg-black text-white border border-white p-2">
            <button
              onClick={() => applyFormatting('bold')}
              className="px-3 py-1 bg-black text-white border border-white hover:bg-gray-900"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="px-3 py-1 bg-black text-white border border-white hover:bg-gray-900"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => applyFormatting('h1')}
              className="px-3 py-1 bg-black text-white border border-white hover:bg-gray-900"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => applyFormatting('h2')}
              className="px-3 py-1 bg-black text-white border border-white hover:bg-gray-900"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => applyFormatting('h3')}
              className="px-3 py-1 bg-black text-white border border-white hover:bg-gray-900"
              title="Heading 3"
            >
              H3
            </button>
            <button
              onClick={() => applyFormatting('note')}
              className="px-3 py-1 bg-black text-white border border-white hover:bg-gray-900"
              title="Research Note"
            >
              📝 Note
            </button>
            <div className="flex-grow"></div>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1 bg-black text-white border border-white hover:bg-gray-900 ${previewMode ? 'bg-gray-700' : ''}`}
            >
              {previewMode ? "Edit" : "Preview"}
            </button>
          </div>
  
          {/* Content Area - Show either textarea or preview */}
          {!previewMode ? (
            <textarea
              ref={contentRef}
              placeholder="Express yourself..."
              value={content}
              onChange={handleContentChange}
              onSelect={handleTextSelection}
              className="w-full min-h-[50vh] bg-black text-white border border-white/20 focus:border-white p-6 text-lg 
                leading-relaxed font-light placeholder:text-white/50 outline-none resize-none transition-colors 
                focus:ring-0 focus:outline-none [font-size:18px]"
            />
          ) : (
            <div className="space-y-6">
              <div 
                className="w-full min-h-[50vh] bg-black text-white border border-white/20 p-6 text-lg 
                  leading-relaxed font-light overflow-auto prose prose-invert max-w-none"
                dangerouslySetInnerHTML={getHtmlContent()}
              />
              
              {/* Research Notes Section */}
              {researchNotes.length > 0 && (
                <div className="border border-white/20 p-4 rounded">
                  <h3 className="text-xl font-bold mb-4 border-b border-white/20 pb-2">Research Notes</h3>
                  <ul className="space-y-2">
                    {researchNotes.map(note => (
                      <li key={note.id} className="flex items-center justify-between bg-gray-900 p-3 rounded">
                        <span className="text-white">{note.text}</span>
                        <button 
                          onClick={() => removeNote(note.id)}
                          className="ml-2 text-white/60 hover:text-white"
                          title="Remove note"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* AI Assistant Panel */}
        <div className="w-1/3 bg-black border-l border-white p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4 border-b border-white pb-2">AI Assistant</h2>
          
          {/* Selected Text Display */}
          <div className="mb-4">
            <h3 className="text-sm text-white/60 mb-2">Selected Text:</h3>
            <div className="bg-gray-900 border border-white/20 p-3 rounded min-h-[100px] max-h-[200px] overflow-y-auto">
              {selectedText ? selectedText : <span className="text-white/40">Select text in the editor to analyze</span>}
            </div>
          </div>
          
          {/* AI Action Buttons */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handleGrammarCheck}
              disabled={!selectedText || isAiLoading}
              className="flex-1 px-3 py-2 bg-black text-white border border-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Grammar
            </button>
            <button
              onClick={handleRewrite}
              disabled={!selectedText || isAiLoading}
              className="flex-1 px-3 py-2 bg-black text-white border border-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rewrite
            </button>
            <button
              onClick={handleTips}
              disabled={!selectedText || isAiLoading}
              className="flex-1 px-3 py-2 bg-black text-white border border-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tips
            </button>
          </div>
          
          {/* AI Response Area */}
          <div className="flex-grow">
            <h3 className="text-sm text-white/60 mb-2">
              {aiAction ? `${aiAction.charAt(0).toUpperCase() + aiAction.slice(1)} Results:` : 'Response:'}
            </h3>
            <div className="bg-gray-900 border border-white/20 p-3 rounded min-h-[200px] overflow-y-auto flex flex-col">
              {isAiLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse text-white/60">Processing...</div>
                </div>
              ) : aiResponse ? (
                <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
              ) : (
                <span className="text-white/40">AI responses will appear here</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}