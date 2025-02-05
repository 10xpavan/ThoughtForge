import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import type { Entry } from "@shared/schema";

function getMoodValue(mood: string | null | undefined): number {
  const moodValues: Record<string, number> = {
    excited: 5,
    happy: 4,
    peaceful: 3,
    neutral: 2,
    sad: 1,
    anxious: 1,
    angry: 1,
  };
  return mood ? moodValues[mood] || 0 : 0;
}

export default function InsightsPage() {
  const { data: entries } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });

  if (!entries?.length) {
    return (
      <Shell>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Mood Insights</CardTitle>
              <CardDescription>
                Start adding entries with moods to see your mood patterns over time.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Shell>
    );
  }

  // Prepare data for the mood chart
  const moodData = entries
    .filter(entry => entry.mood && entry.moodIntensity)
    .map(entry => ({
      date: format(new Date(entry.createdAt), "MMM d"),
      mood: entry.mood,
      intensity: entry.moodIntensity,
      value: getMoodValue(entry.mood),
    }))
    .slice(-14); // Last 14 days

  // Calculate mood statistics
  const moodCounts: Record<string, number> = {};
  entries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });

  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mood Over Time</CardTitle>
            <CardDescription>
              Your mood patterns for the last 14 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="intensity"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
              <CardDescription>
                How often you experience different moods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(moodCounts).map(([mood, count]) => (
                  <div key={mood} className="flex items-center justify-between">
                    <span className="capitalize">{mood}</span>
                    <span className="text-muted-foreground">{count} times</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mood Summary</CardTitle>
              <CardDescription>
                Key insights about your emotional patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Most frequent mood</p>
                  <p className="text-lg font-medium capitalize">{dominantMood || "No data"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total entries with mood</p>
                  <p className="text-lg font-medium">
                    {entries.filter(e => e.mood).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
