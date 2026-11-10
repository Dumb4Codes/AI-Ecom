import Banner from "@/components/banner";
import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import RouteFallback from "@/components/route-fallback";
import { useUser } from "@/hooks/use-user";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

// The cart drawer and auth dialog are only needed once the user opens them,
// so keep them (and their Radix dependencies) out of the first-load bundle.
const CartSheet = lazy(() => import("@/components/cart-sheet"));
const AuthDialog = lazy(() =>
  import("@/components/auth-dialog").then((m) => ({ default: m.AuthDialog })),
);

/** Mounts `children` the first time `open` becomes true, then keeps them mounted
 *  so close animations and internal state keep working. */
const MountOnFirstOpen = ({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) => {
  const [hasOpened, setHasOpened] = useState(open);
  // Adjusting state during render is the documented pattern for derived flags.
  if (open && !hasOpened) setHasOpened(true);
  return hasOpened ? <Suspense fallback={null}>{children}</Suspense> : null;
};

const AppLayout = () => {
  const { data: user } = useUser();
  const fetchCart = useCart((state) => state.fetchCart);
  const isCartOpen = useCart((state) => state.isCartOpen);
  const isAuthOpen = useAuth((state) => state.isAuthOpen);

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  return (
    <div className="flex min-h-screen flex-col">
      <Banner />
      <Nav />
      <main className="min-h-0 w-full max-width mx-auto px-4 min-[1272px]:px-0 flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MountOnFirstOpen open={isCartOpen}>
        <CartSheet />
      </MountOnFirstOpen>
      <MountOnFirstOpen open={isAuthOpen}>
        <AuthDialog />
      </MountOnFirstOpen>
    </div>
  );
};

export default AppLayout;
