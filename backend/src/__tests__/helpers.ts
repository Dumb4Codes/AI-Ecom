import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../app";
import UserModel from "../models/user.model";
import CategoryModel from "../models/category.model";
import ProductModel from "../models/product.model";
import { USER_ROLES } from "../constants/enums";

export const app = createApp();

export const connect = async () => {
  await mongoose.connect(process.env.MONGO_URI!);
};

export const resetDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.syncIndexes().catch(() => undefined);
};

export const disconnect = async () => {
  await mongoose.disconnect();
};

const rand = () => Math.random().toString(36).slice(2);

/** Registers a user through the API and returns a supertest agent holding the auth cookie. */
export const registerAgent = async (
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) => {
  const agent = request.agent(app);
  const body = {
    name: "Test User",
    email: `user${rand()}@example.com`,
    password: "secret123",
    ...overrides,
  };
  const res = await agent.post("/api/auth/register").send(body);
  return { agent, body, res };
};

export const makeAdminAgent = async () => {
  const { agent, body } = await registerAgent({ email: "admin@example.com" });
  await UserModel.updateOne({ email: body.email }, { role: USER_ROLES.ADMIN });
  return agent;
};

export const seedProduct = async (
  overrides: Partial<{
    name: string;
    originalPrice: number;
    stockCount: number;
    discountPercent: number;
  }> = {},
) => {
  const owner = await UserModel.create({
    name: "Seeder",
    email: `seed${rand()}@example.com`,
    password: "secret123",
    role: USER_ROLES.ADMIN,
  });
  const category =
    (await CategoryModel.findOne()) ??
    (await CategoryModel.create({ name: "Fruits", slug: "fruits" }));
  return ProductModel.create({
    userId: owner._id,
    categoryId: category._id,
    name: "Banana",
    originalPrice: 10,
    unit: "kg",
    stockCount: 5,
    ...overrides,
  });
};
