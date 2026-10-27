import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/tanya-ai.mjs";

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
