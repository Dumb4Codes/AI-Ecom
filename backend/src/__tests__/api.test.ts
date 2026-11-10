import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import ProductModel from "../models/product.model";
import {
  app,
  connect,
  resetDb,
  disconnect,
  registerAgent,
  makeAdminAgent,
  seedProduct,
} from "./helpers";

beforeAll(connect);
afterAll(disconnect);
beforeEach(resetDb);

describe("platform", () => {
  it("GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });

  it("unknown /api route returns a JSON 404", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("ERR_NOT_FOUND");
  });

  it("malformed JSON is a 400, not a 500", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
  });

  it("sets security headers and hides x-powered-by", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("auth", () => {
  it("registers, never leaks the password hash, and sets an httpOnly cookie", async () => {
    const { res } = await registerAgent();
    expect(res.status).toBe(201);
    expect(res.body.user.password).toBeUndefined();
    expect(String(res.headers["set-cookie"])).toMatch(/HttpOnly/i);
  });

  it("rejects duplicate emails and invalid payloads", async () => {
    const { body } = await registerAgent({ email: "dup@example.com" });
    const dup = await request(app).post("/api/auth/register").send(body);
    expect(dup.status).toBe(400);
    const bad = await request(app).post("/api/auth/register").send({ email: "x" });
    expect(bad.status).toBe(400);
    expect(bad.body.errorCode).toBe("ERR_VALIDATION");
  });

  it("login uses the same error for wrong password and unknown user", async () => {
    const { body } = await registerAgent({ email: "a@example.com" });
    const wrongPw = await request(app)
      .post("/api/auth/login")
      .send({ email: body.email, password: "nope-nope" });
    const noUser = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "nope-nope" });
    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body.message).toBe(noUser.body.message);
  });

  it("status requires a session; logout clears it", async () => {
    expect((await request(app).get("/api/auth/status")).status).toBe(401);
    const { agent } = await registerAgent();
    expect((await agent.get("/api/auth/status")).body.user.isAdmin).toBe(false);
    await agent.post("/api/auth/logout");
    expect((await agent.get("/api/auth/status")).status).toBe(401);
  });
});

describe("authorization", () => {
  it("anonymous users cannot reach protected resources", async () => {
    for (const path of ["/api/orders", "/api/addresses", "/api/admin/analytics"]) {
      expect((await request(app).get(path)).status).toBe(401);
    }
  });

  it("regular users get 403 on admin routes; admins get 200", async () => {
    const { agent } = await registerAgent();
    expect((await agent.get("/api/admin/analytics")).status).toBe(403);
    expect((await agent.post("/api/admin/ai/generate").send({})).status).toBe(403);
    const admin = await makeAdminAgent();
    const res = await admin.get("/api/admin/analytics");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalOutOfStock");
  });

  it("a malformed order id is a client error, not a 500", async () => {
    const { agent } = await registerAgent();
    const res = await agent.get("/api/orders/not-an-id");
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

describe("products", () => {
  it("lists products and finds them by keyword", async () => {
    await seedProduct({ name: "Green Apple" });
    const res = await request(app).get("/api/products?keyword=apple");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.pagination).toHaveProperty("hasNextPage");
  });

  it("treats regex metacharacters in the keyword literally (no injection / ReDoS)", async () => {
    await seedProduct({ name: "Green Apple" });
    const res = await request(app).get("/api/products").query({ keyword: ".*" });
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
    const redos = await request(app).get("/api/products").query({ keyword: "(a+)+$" });
    expect(redos.status).toBe(200);
  });

  it("rejects absurdly long keywords", async () => {
    const res = await request(app).get("/api/products").query({ keyword: "a".repeat(500) });
    expect(res.status).toBe(400);
  });
});

describe("checkout", () => {
  const address = {
    recipientName: "Jane",
    phone: "123",
    street: "1 Main",
    city: "X",
    state: "Y",
    postalCode: "1",
    country: "Z",
  };

  it("places a COD order and decrements stock", async () => {
    const product = await seedProduct({ stockCount: 5, originalPrice: 10 });
    const { agent } = await registerAgent();
    await agent
      .post("/api/cart")
      .send({ items: [{ productId: String(product._id), quantity: 2 }] });
    const addr = await agent.post("/api/addresses").send(address);
    expect(addr.status).toBeLessThan(300);
    const res = await agent.post("/api/orders").send({
      addressId: addr.body.address._id,
      paymentMethod: "cash_on_delivery",
    });
    expect(res.status).toBe(201);
    expect((await ProductModel.findById(product._id))!.stockCount).toBe(3);
  });

  it("refuses to oversell", async () => {
    const product = await seedProduct({ stockCount: 1 });
    const { agent } = await registerAgent();
    await agent
      .post("/api/cart")
      .send({ items: [{ productId: String(product._id), quantity: 1 }] });
    const addr = await agent.post("/api/addresses").send(address);
    await ProductModel.updateOne({ _id: product._id }, { stockCount: 0 });
    const res = await agent.post("/api/orders").send({
      addressId: addr.body.address._id,
      paymentMethod: "cash_on_delivery",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/stock/i);
  });
});
