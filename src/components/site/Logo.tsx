import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * Apresentação Oficial da Logo Sol & Mar Rent a Car.
 *
 * Utiliza a imagem oficial com eliminação das margens escuras vazias desnecessárias,
 * garantindo que a tipografia "Sol&Mar RENT A CAR Locação de Veículos" e o sol ocupem
 * todo o espaço visual com nitidez, amplitude horizontal e sem distorções.
 */
export function Logo({
  className,
  imageClassName,
  priority = false,
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn(
        "group flex items-center shrink-0 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl",
        className,
      )}
      aria-label="Sol & Mar Rent a Car — página inicial"
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/80 bg-[#0f1c30] transition-all duration-300 group-hover:ring-primary/60 group-hover:shadow-md",
          imageClassName || "h-14 sm:h-18 lg:h-22 w-auto aspect-[1242/1130]",
        )}
      >
        <img
          src="/logo-sol-e-mar-clean.png"
          alt="Sol & Mar Rent a Car"
          width={220}
          height={200}
          loading={priority ? "eager" : "lazy"}
          className="size-full object-contain p-0.5 transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </Link>
  );
}
