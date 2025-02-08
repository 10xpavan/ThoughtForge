
import { Moon, Sun, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
];

export function ThemeSwitcher() {
  const { data: preferences } = useQuery({
    queryKey: ["/api/preferences"],
  });

  const updateTheme = useMutation({
    mutationFn: async (theme: Theme) => {
      const res = await apiRequest("PATCH", "/api/preferences", { theme });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
    },
  });

  useEffect(() => {
    const theme = preferences?.theme || "system";
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
    }
  }, [preferences?.theme]);

  const currentTheme = preferences?.theme || "system";
  const Icon = themes.find((t) => t.value === currentTheme)?.icon || Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Change theme"
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => updateTheme.mutate(value)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
