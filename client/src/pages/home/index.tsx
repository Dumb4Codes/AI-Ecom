
import HeroCarousel from "./hero-carousel";
import CategoriesSection from "./categories-section";
import TodayDealsSection from "./deals-section";
import ProductSections from "./product-sections";

const HomePage = () => {
  return (
    <div className="w-full">
      <h1 className="sr-only">Instant – fresh groceries delivered fast</h1>
      <HeroCarousel />
      <CategoriesSection />
      <TodayDealsSection />
      <ProductSections />
    </div>
  )
}

export default HomePage
