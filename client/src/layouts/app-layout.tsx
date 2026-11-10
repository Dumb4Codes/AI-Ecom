import Banner from "@/components/banner";
import CartSheet from "@/components/cart-sheet";
import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { AuthDialog } from "@/components/auth-dialog";
import { Outlet } from "react-router-dom";
import { Suspense, useEffect } from "react";
import RouteFallback from "@/components/route-fallback";
import { useUser } from "@/hooks/use-user";
import { useCart } from "@/hooks/use-cart";

const AppLayout = () => {
  const { data: user } = useUser();
  const fetchCart = useCart((state) => state.fetchCart);

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
      <CartSheet />
      <AuthDialog />
    </div>
  );
};

export default AppLayout;
