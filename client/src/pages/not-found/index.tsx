import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFoundPage = () => (
  <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
    <p className="text-sm font-bold uppercase tracking-wide text-primary">404</p>
    <h1 className="font-serif text-3xl font-semibold">Page not found</h1>
    <p className="text-sm text-muted-foreground">
      The page you're looking for doesn't exist or has moved.
    </p>
    <Button asChild>
      <Link to="/">Back to home</Link>
    </Button>
  </div>
);

export default NotFoundPage;
