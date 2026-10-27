import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/tanya-ai.mjs";
import { buildProductContext } from "../data/knowledge/tcs-products.mjs";

test("chat endpoint rejects methods other than POST", async () => {
  const response = await handler(new Request("https://example.test/api/tanya-ai", {
    method: "GET"
  }));
  assert.equal(response.status, 405);
  assert.match((await response.json()).error, /Metode tidak diizinkan/i);
});

test("chat endpoint handles preflight without requiring credentials", async () => {
  const response = await handler(new Request("https://example.test/api/tanya-ai", {
    method: "OPTIONS"
  }));
  assert.equal(response.status, 204);
});

test("chat endpoint does not accept unauthenticated requests", async () => {
  const response = await handler(new Request("https://example.test/api/tanya-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "test" })
  }));
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /Login dulu/i);
});

test("product retrieval returns all ten products for a broad TCS query", () => {
  const context = buildProductContext("Apa saja produk TCS?");
  assert.match(context, /TCS UMKM Stock & Sales Tracker/);
  assert.match(context, /TCS Complete UMKM Suite/);
  assert.equal((context.match(/PRODUK:/g) || []).length, 10);
});

test("product retrieval distinguishes unverified concepts from confirmed artifacts", () => {
  const context = buildProductContext("TCS Business Document Kit");
  assert.match(context, /belum terverifikasi/i);
  assert.match(context, /Sumber publik:/);
  assert.doesNotMatch(context, /INTERNAL GPT KNOWLEDGE FILE/);
});
