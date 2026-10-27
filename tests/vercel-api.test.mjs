import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
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
  assert.equal((context.match(/PRODUK:/g) || []).length, 1);
  assert.doesNotMatch(context, /INTERNAL GPT KNOWLEDGE FILE/);
});

test("ad rotation waits for consent and does not expose an empty slot", () => {
  const slot = { hidden: true, dataset: {} };
  let loadCount = 0;
  const fakeWindow = {
    loadChocoNativeAd() { loadCount += 1; }
  };
  const fakeDocument = {
    visibilityState: "visible",
    addEventListener() {},
    getElementById(id) { return id === "nativeAdPlacement" ? slot : null; }
  };
  const context = {
    window: fakeWindow,
    document: fakeDocument,
    localStorage: { getItem() { return JSON.stringify({ adsAllowed: true }); } },
    setTimeout() { throw new Error("A single active provider should not create a rotation timer"); },
    clearTimeout() {},
    JSON
  };
  const script = readFileSync(fileURLToPath(new URL("../public/ad-rotation.js", import.meta.url)), "utf8");
  vm.runInNewContext(script, context);
  assert.equal(fakeWindow.chocoActiveAdProvider, "adsterra");
  assert.equal(loadCount, 1);
  assert.equal(slot.hidden, true);
});

test("ad rotation does not load ads without consent", () => {
  let loadCount = 0;
  const context = {
    window: { loadChocoNativeAd() { loadCount += 1; } },
    document: { visibilityState: "visible", addEventListener() {}, getElementById() { return { hidden: true, dataset: {} }; } },
    localStorage: { getItem() { return JSON.stringify({ adsAllowed: false }); } },
    setTimeout() { throw new Error("No timer should start without consent"); },
    clearTimeout() {},
    JSON
  };
  const script = readFileSync(fileURLToPath(new URL("../public/ad-rotation.js", import.meta.url)), "utf8");
  vm.runInNewContext(script, context);
  assert.equal(loadCount, 0);
});
