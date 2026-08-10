import Link from "next/link";
import { APP_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/image/logo.png";

type AppLogoProps = {
  /** Destination. Defaults to the marketing homepage `/`. */
  href?: string;
  /** Visual size preset */
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  priority?: boolean;
};

/**
 * Display height classes. Native <img> avoids next/image w-auto collapse
 * with this wide wordmark (≈3.3:1).
 */
const SIZE_CLASS = {
  sm: "h-9",
  md: "h-12 sm:h-14",
  lg: "h-16 sm:h-20",
  hero: "h-24 w-auto max-w-[min(100%,36rem)] sm:h-32 md:h-40",
} as const;

export function AppLogo({
  href = "/",
  size = "md",
  className,
  priority = false,
}: AppLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`${APP_NAME} トップへ`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- wordmark needs reliable CSS sizing */}
      <img
        src={LOGO_SRC}
        alt={APP_NAME}
        width={813}
        height={245}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        className={cn(
          "w-auto max-w-full object-contain object-left",
          SIZE_CLASS[size],
        )}
      />
    </Link>
  );
}
