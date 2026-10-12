import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={cn(
        "relative grid size-10 place-items-center rounded-xl border transition-all duration-300",
        "border-border bg-surface/80 text-foreground hover:bg-surface-2 hover:border-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
    >
      <Sun
        className={cn(
          "size-4.5 transition-all duration-300 text-amber-500",
          isDark ? "scale-0 rotate-90 opacity-0 absolute" : "scale-100 rotate-0 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "size-4.5 transition-all duration-300 text-sky-400",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0 absolute",
        )}
      />
      <span className="sr-only">
        {isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      </span>
    </button>
  );
}
