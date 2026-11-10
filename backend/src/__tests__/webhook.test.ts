import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";

// Stripe signature verification is stubbed: the "signed" payload is the event JSON.
vi.mock("../config/stripe.config", () => ({
  default: {
    webhooks: {
      constructEvent: (payload: Buffer) => JSON.parse(payload.toString()),
    },
  },
}));

import OrderModel from "../models/order.model";
import ProductModel from "../models/product.model";
import UserModel from "../models/user.model";
import { app, connect, resetDb, disconnect, seedProduct } from "./helpers";

beforeAll(connect);
afterAll(disconnect);
beforeEach(resetDb);

const sendEvent = (type: string, orderId: string) =>
  request(app)
    .post("/api/webhook/stripe")
    .set("Content-Type", "application/json")
    .set("stripe-signature", "t=1,v1=stub")
    .send(JSON.stringify({ type, data: { object: { metadata: { orderId } } } }));

const makePendingCardOrder = async (quantity: number) => {
  const product = await seedProduct({ stockCount: 10, originalPrice: 10 });
  const user = await UserModel.create({
    name: "Buyer",
    email: "buyer@example.com",
    password: "secret123",
  });
  const order = await OrderModel.create({
    userId: user._id,
    items: [
      {
        productId: product._id,
        name: product.name,
        image: "",
        originalPrice: 10,
        discountPercent: 0,
        salePrice: 10,
        quantity,
      },
    ],
    shippingAddress: {
      recipientName: "J",
      phone: "1",
      street: "s",
      city: "c",
      state: "s",
      postalCode: "1",
      country: "z",
    },
    paymentMethod: "card",
    subtotal: 10 * quantity,
    deliveryFee: 0,
    tax: 0,
    total: 10 * quantity,
  });
  return { product, order };
};

describe("stripe webhook", () => {
  it("rejects a bad signature", async () => {
    const res = await request(app)
      .post("/api/webhook/stripe")
      .set("Content-Type", "application/json")
      .send("not json at all");
    expect(res.status).toBe(400);
  });

  it("confirms the order and decrements stock exactly once, even if the event is replayed", async () => {
    const { product, order } = await makePendingCardOrder(3);

    expect((await sendEvent("checkout.session.completed", String(order._id))).status).toBe(200);
    expect((await sendEvent("checkout.session.completed", String(order._id))).status).toBe(200);

    const updated = await OrderModel.findById(order._id);
    expect(updated!.paymentStatus).toBe("paid");
    expect(updated!.status).toBe("confirmed");
    expect(updated!.statusHistory.filter((h) => h.status === "confirmed")).toHaveLength(1);
    expect((await ProductModel.findById(product._id))!.stockCount).toBe(7);
  });

  it("an expiry event cannot cancel an already-paid order", async () => {
    const { order } = await makePendingCardOrder(1);
    await sendEvent("checkout.session.completed", String(order._id));
    await sendEvent("checkout.session.expired", String(order._id));
    const updated = await OrderModel.findById(order._id);
    expect(updated!.paymentStatus).toBe("paid");
    expect(updated!.status).toBe("confirmed");
  });
});
