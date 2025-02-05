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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        {entries?.map((entry) => (
          <Link key={entry.id} href={`/entry/${entry.id}`}>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>{entry.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(entry.createdAt), "PPP")}
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="line-clamp-3 text-muted-foreground"
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
