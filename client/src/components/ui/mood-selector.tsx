import { useState } from "react";
import { Button } from "./button";
import { Label } from "./label";
import { Slider } from "./slider";
import { Textarea } from "./textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import {
  Smile,
  Laugh,
  Coffee,
  Meh,
  Frown,
  AlertCircle,
  Angry,
} from "lucide-react";
import type { Mood } from "@shared/schema";

const moodIcons = {
  happy: Smile,
  excited: Laugh,
  peaceful: Coffee,
  neutral: Meh,
  sad: Frown,
  anxious: AlertCircle,
  angry: Angry,
};

interface MoodSelectorProps {
  mood?: string;
  moodIntensity?: number;
  moodNotes?: string;
  onChange: (values: { mood: string; moodIntensity: number; moodNotes: string }) => void;
}

export function MoodSelector({ mood, moodIntensity = 3, moodNotes = "", onChange }: MoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMoodSelect = (selectedMood: string) => {
    onChange({ mood: selectedMood, moodIntensity, moodNotes });
  };

  const handleIntensityChange = (value: number[]) => {
    onChange({ mood: mood || "", moodIntensity: value[0], moodNotes });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ mood: mood || "", moodIntensity, moodNotes: e.target.value });
  };

  const MoodIcon = mood ? moodIcons[mood as Mood] : Meh;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <MoodIcon className="h-4 w-4" />
          {mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : "Add Mood"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">How are you feeling?</h4>
            <p className="text-sm text-muted-foreground">
              Select your current mood and its intensity
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(moodIcons).map(([key, Icon]) => (
              <Button
                key={key}
                variant={mood === key ? "default" : "outline"}
                className="h-9 p-0"
                onClick={() => handleMoodSelect(key)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Intensity</Label>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[moodIntensity]}
              onValueChange={handleIntensityChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes about your mood (optional)</Label>
            <Textarea
              placeholder="What made you feel this way?"
              value={moodNotes}
              onChange={handleNotesChange}
              className="h-20"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
