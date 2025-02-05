import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { format } from "date-fns";
import type { Entry } from "@shared/schema";

export default function Home() {
  const { data: entries, isLoading } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="py-3">
                <div className="h-4 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent className="py-2">
                <div className="h-3 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Shell>
    );
  }

  if (!entries?.length) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto text-center space-y-4">
          <pre className="font-mono text-muted-foreground inline-block text-left">
            {`      _____
    .;_____;.
   /_____/_\\\\
  |[  ]|[  ]|
  |____|____|
`}
          </pre>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Welcome to Your Journal</h2>
            <p className="text-sm text-muted-foreground">
              Start writing your thoughts and tracking your journey.
            </p>
            <Link href="/new">
              <a className="inline-flex">
                <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                  Create Your First Entry
                </button>
              </a>
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-xl mx-auto space-y-3">
        {entries?.map((entry) => (
          <Link key={entry.id} href={`/entry/${entry.id}`}>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="py-3">
                <CardTitle className="text-base">{entry.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.createdAt), "MMM d, yyyy")}
                </p>
              </CardHeader>
              <CardContent className="py-2">
                <div
                  className="line-clamp-2 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}