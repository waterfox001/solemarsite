import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 44 }: { className?: string; size?: number }) {
  return (
    <Link
      to="/"
      className={cn("group flex items-center gap-3", className)}
      aria-label="Sol & Mar Rent a Car — página inicial"
    >
      <img
        src="/logo%20sol%20e%20mar.jpeg"
        alt="Logo Sol & Mar Rent a Car"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-xl object-cover ring-1 ring-border transition-transform duration-500 group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Sol<span className="text-accent">&</span>Mar
        </span>
        <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Rent a Car
        </span>
      </span>
    </Link>
  );
}
