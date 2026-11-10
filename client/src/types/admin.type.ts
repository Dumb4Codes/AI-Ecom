import type { AdminOrdersResponse } from "./order.type";
import type { PaginationType, ProductType } from "./products.type";

export type { AdminOrdersResponse };

export type AdminAnalyticsType = {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalOutOfStock: number;
};

export type AdminAnalyticsResponse = {
  message: string;
} & AdminAnalyticsType;

export type AdminProductType = ProductType & {
  description?: string;
  isActive: boolean;
  categoryId: string | { _id: string; name: string; slug?: string };
};

export type AdminProductsResponse = {
  message: string;
  products: AdminProductType[];
  pagination: PaginationType;
};

export type AdminProductResponse = {
  message: string;
  product: AdminProductType;
};

export type ProductInput = {
  categoryId: string;
  name: string;
  description?: string;
  images: string[];
  originalPrice: number;
  discountPercent?: number;
  discountLabel?: string | null;
  unit: string;
  stockCount?: number;
  isActive?: boolean;
};

export type UpdateOrderStatusInput = {
  status: string;
  note?: string;
};

export type UpdateOrderStatusResponse = {
  message: string;
  order: import("./order.type").OrderType;
};
