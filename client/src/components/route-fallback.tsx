import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Suspense fallback shown while a lazily loaded route chunk downloads. */
const RouteFallback = ({ className }: { className?: string }) => (
  <div
    role="status"
    aria-live="polite"
    className={cn("flex min-h-[50vh] w-full items-center justify-center", className)}
  >
    <Spinner className="size-8" />
    <span className="sr-only">Loading…</span>
  </div>
);

export default RouteFallback;
