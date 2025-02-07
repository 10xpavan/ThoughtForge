import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, PenSquare, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useState } from "react";
import { useLocation } from "wouter";

export function Shell({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search/${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-3 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="link" className="text-base font-bold text-foreground hover:opacity-80 transition-opacity p-0">
                Journal
              </Button>
            </Link>
            <ThemeSwitcher />
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted pl-8 h-8 text-sm"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link href="/new">
              <Button size="sm" className="gap-1.5">
                <PenSquare className="h-3.5 w-3.5" />
                New
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-4">
        {children}
      </main>
    </div>
  );
}