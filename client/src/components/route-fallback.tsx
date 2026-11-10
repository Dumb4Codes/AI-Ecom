import { Spinner } from "@/components/ui/spinner";

/** Suspense fallback shown while a lazily loaded route chunk downloads. */
const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-[50vh] w-full items-center justify-center"
  >
    <Spinner className="size-8" />
    <span className="sr-only">Loading…</span>
  </div>
);

export default RouteFallback;
