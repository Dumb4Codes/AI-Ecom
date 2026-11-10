import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { formatPrice, getStockDisplay, splitPrice } from "./helper";
import { calculateSalePrice, cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

describe("formatPrice / splitPrice", () => {
  it("formats USD", () => {
    expect(formatPrice(1234.5)).toBe("$1,234.50");
  });
  it("splits dollars and cents", () => {
    expect(splitPrice(7.05)).toEqual({ dollars: 7, cents: 5 });
    expect(splitPrice(3)).toEqual({ dollars: 3, cents: 0 });
  });
});

describe("getStockDisplay", () => {
  it("reports out / low / plenty", () => {
    expect(getStockDisplay({ stockCount: 0 }).status).toBe("out");
    expect(getStockDisplay({ stockCount: 3 }).status).toBe("low");
    expect(getStockDisplay({ stockCount: 50 }).status).toBe("in-stock");
    expect(getStockDisplay({}).status).toBe("in-stock");
  });
});

describe("calculateSalePrice", () => {
  it("avoids floating point drift by working in cents", () => {
    expect(calculateSalePrice(19.99, 10)).toBe(17.99);
    expect(calculateSalePrice(10, 0)).toBe(10);
    expect(calculateSalePrice(10, 100)).toBe(0);
  });
});

describe("cn", () => {
  it("merges conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("getErrorMessage", () => {
  it("prefers the API message", () => {
    const err = new AxiosError("Request failed");
    err.response = {
      data: { message: "Email already in use" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };
    expect(getErrorMessage(err, "fallback")).toBe("Email already in use");
  });
  it("falls back for unknown values", () => {
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });
});
