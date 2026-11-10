import { Suspense } from "react";
import RouteFallback from "@/components/route-fallback";
import { Outlet, ScrollRestoration } from "react-router-dom";

const RootLayout = () => (
  <>
    <ScrollRestoration />
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  </>
);

export default RootLayout;
