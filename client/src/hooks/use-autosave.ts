import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';
import { GoogleDriveService } from '@/lib/googleDrive';

interface AutosaveOptions {
  title: string;
  content: string;
  driveService: GoogleDriveService | null;
  onSave?: (fileId: string) => void;
  onSaveStart?: () => void;
  onSaveEnd?: (success: boolean) => void;
  debounceMs?: number;
}

export interface AutosaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

export function useAutosave({
  title,
  content,
  driveService,
  onSave,
  onSaveStart,
  onSaveEnd,
  debounceMs = 5000
}: AutosaveOptions) {
  const { toast } = useToast();
  const [status, setStatus] = useState<AutosaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null
  });
  
  const lastSavedContent = useRef(content);
  const lastSavedTitle = useRef(title);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  useEffect(() => {
    const save = async () => {
      // Skip save if content is empty
      if (!content.trim()) {
        return;
      }

      // Prevent saving if already in progress
      if (isSavingRef.current) return;

      // Don't save if nothing has changed
      if (
        content.trim() === lastSavedContent.current?.trim() &&
        (title || 'Untitled').trim() === (lastSavedTitle.current || 'Untitled').trim()
      ) {
        return;
      }

      try {
        isSavingRef.current = true;
        onSaveStart?.();
        setStatus(prev => ({ ...prev, isSaving: true, error: null }));

        if (!driveService) return;

        const response = await driveService.uploadFile(
          title.trim() || 'Untitled',
          content
        );
        
        // Update last saved state
        lastSavedContent.current = content;
        lastSavedTitle.current = title;
        
        // Update status
        setStatus(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          error: null
        }));

        // Notify parent component
        onSave?.(response.id);
        onSaveEnd?.(true);

      } catch (error) {
        console.error('Autosave failed:', error);
        setStatus(prev => ({
          ...prev,
          isSaving: false,
          error: error instanceof Error ? error : new Error('Autosave failed')
        }));
        onSaveEnd?.(false);
        
        toast({
          title: "Autosave failed",
          description: "Could not backup to Google Drive. Your work is still saved locally.",
          variant: "destructive",
        });
      } finally {
        isSavingRef.current = false;
      }
    };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timeout if we have content
    if (content.trim()) {
      timeoutRef.current = setTimeout(save, debounceMs);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, title, driveService, onSave, onSaveStart, onSaveEnd, debounceMs, toast]);

  return status;
}
