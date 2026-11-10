import { describe, it, expect } from "vitest";
import { calculateSalePrice } from "../utils/price.util";
import { calculateCartTotals } from "../utils/cart.util";
import { escapeRegExp } from "../utils/regex.util";

describe("calculateSalePrice", () => {
  it("applies a percentage discount and rounds to cents", () => {
    expect(calculateSalePrice(10, 25)).toBe(7.5);
    expect(calculateSalePrice(9.99, 33)).toBe(6.69);
  });
  it("returns the original price for 0% discount", () => {
    expect(calculateSalePrice(12.5, 0)).toBe(12.5);
  });
});

describe("calculateCartTotals", () => {
  it("charges delivery below the free-delivery threshold", () => {
    const t = calculateCartTotals([{ productId: { salePrice: 5 }, quantity: 2 }]);
    expect(t.subtotal).toBe(10);
    expect(t.deliveryFee).toBe(4.99);
    expect(t.tax).toBe(0.8);
    expect(t.orderTotal).toBe(15.79);
  });
  it("waives delivery at or above the threshold", () => {
    const t = calculateCartTotals([{ productId: { salePrice: 10 }, quantity: 2 }]);
    expect(t.deliveryFee).toBe(0);
    expect(t.orderTotal).toBe(21.6);
  });
});

describe("escapeRegExp", () => {
  it("neutralises regex metacharacters", () => {
    const evil = "(a+)+$.*[x]";
    expect(new RegExp(escapeRegExp(evil)).test(evil)).toBe(true);
    expect(new RegExp(escapeRegExp("a.c")).test("abc")).toBe(false);
  });
});
