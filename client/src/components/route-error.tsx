import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** Router-level error boundary: render/loader errors and chunk-load failures. */
const RouteError = () => {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong while loading this page.";

  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h1 className="font-serif text-2xl font-semibold">Oops, that didn't work</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>Reload page</Button>
        <Button variant="outline" asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
};

export default RouteError;
