import "dotenv/config";
import mongoose from "mongoose";
import ProductModel from "../models/product.model";
import CategoryModel from "../models/category.model";
import UserModel from "../models/user.model";
import { USER_ROLES } from "../constants/enums";

/**
 * Adds sample catalog products. Safe to re-run: products are matched by name,
 * existing ones are left untouched, and nothing is ever deleted.
 *
 *   MONGO_URI=... DEMO_ADMIN_EMAIL=... npm run seed:demo-products
 *
 * Images are served from the client's /public/products folder. Override the
 * host with IMAGE_BASE_URL if the frontend lives somewhere else.
 */
const IMAGE_BASE_URL = (
  process.env.IMAGE_BASE_URL ?? "https://ai-ecom-mocha.vercel.app/products"
).replace(/\/$/, "");

type Seed = {
  name: string;
  category: string;
  image: string;
  description: string;
  originalPrice: number;
  discountPercent?: number;
  discountLabel?: string;
  unit: string;
  stockCount: number;
};

const products: Seed[] = [
  { name: "Organic Bananas", category: "Fruits & Vegetables", image: "bananas", description: "Sweet, ripe organic bananas. A good source of potassium and ideal for snacks and smoothies.", originalPrice: 3.49, discountPercent: 10, discountLabel: "10% OFF", unit: "kg", stockCount: 120 },
  { name: "Crisp Red Apples", category: "Fruits & Vegetables", image: "apples", description: "Juicy, crunchy red apples picked at peak season.", originalPrice: 4.99, unit: "kg", stockCount: 90 },
  { name: "Fresh Strawberries", category: "Fruits & Vegetables", image: "strawberries", description: "Sweet, hand-picked strawberries. Perfect with breakfast or dessert.", originalPrice: 5.99, discountPercent: 20, discountLabel: "Deal", unit: "400g", stockCount: 60 },
  { name: "Ripe Hass Avocados", category: "Fruits & Vegetables", image: "avocados", description: "Creamy Hass avocados, ready to eat within a day or two.", originalPrice: 2.49, unit: "pc", stockCount: 80 },
  { name: "Sourdough Loaf", category: "Bakery", image: "sourdough", description: "Slow-fermented sourdough with a crackly crust and soft, tangy crumb.", originalPrice: 4.5, unit: "pc", stockCount: 35 },
  { name: "Butter Croissant", category: "Bakery", image: "croissant", description: "Flaky, golden croissant baked fresh every morning with real butter.", originalPrice: 2.25, discountPercent: 15, discountLabel: "15% OFF", unit: "pc", stockCount: 48 },
  { name: "Fresh Orange Juice", category: "Beverages", image: "orange-juice", description: "Cold-pressed orange juice with no added sugar.", originalPrice: 5.99, discountPercent: 15, discountLabel: "15% OFF", unit: "1L", stockCount: 40 },
  { name: "Cold Brew Coffee", category: "Beverages", image: "cold-brew", description: "Smooth, low-acid cold brew steeped for 18 hours. Serve over ice.", originalPrice: 4.25, unit: "500ml", stockCount: 55 },
  { name: "Sea Salt Potato Chips", category: "Snacks", image: "chips", description: "Thin, crunchy kettle-style chips with just oil and sea salt.", originalPrice: 3.2, unit: "150g", stockCount: 100 },
  { name: "70% Dark Chocolate", category: "Snacks", image: "chocolate", description: "Rich dark chocolate with a clean, slightly fruity finish.", originalPrice: 3.75, discountPercent: 10, discountLabel: "10% OFF", unit: "100g", stockCount: 70 },
  { name: "Extra Virgin Olive Oil", category: "Pantry Staples", image: "olive-oil", description: "Cold-pressed extra virgin olive oil for dressings, dipping and finishing.", originalPrice: 11.9, unit: "500ml", stockCount: 25 },
  { name: "Atlantic Salmon Fillet", category: "Meat & Seafood", image: "salmon", description: "Skin-on Atlantic salmon fillet, rich in omega-3. Pan-sear, bake or grill.", originalPrice: 9.99, discountPercent: 10, discountLabel: "10% OFF", unit: "300g", stockCount: 20 },
];

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  const ownerEmail = process.env.DEMO_ADMIN_EMAIL;
  if (!mongoUri || !ownerEmail) {
    throw new Error("Set MONGO_URI and DEMO_ADMIN_EMAIL (an existing admin user)");
  }

  await mongoose.connect(mongoUri);

  const owner = await UserModel.findOne({ email: ownerEmail, role: USER_ROLES.ADMIN });
  if (!owner) throw new Error(`No admin user found for ${ownerEmail}. Run seed:demo-admin first.`);

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const category = await CategoryModel.findOne({ name: p.category });
    if (!category) {
      console.warn(`Skipping "${p.name}": category "${p.category}" not found`);
      skipped++;
      continue;
    }
    if (await ProductModel.exists({ name: p.name })) {
      skipped++;
      continue;
    }
    await ProductModel.create({
      userId: owner._id,
      categoryId: category._id,
      name: p.name,
      description: p.description,
      images: [`${IMAGE_BASE_URL}/${p.image}.webp`],
      originalPrice: p.originalPrice,
      discountPercent: p.discountPercent ?? 0,
      discountLabel: p.discountLabel,
      unit: p.unit,
      stockCount: p.stockCount,
      isActive: true,
    });
    created++;
  }

  console.log(`Created ${created} products, skipped ${skipped}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
