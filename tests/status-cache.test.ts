import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { GET } from "../src/app/api/status/route";
import * as landingPage from "../src/app/page";

test("status endpoint returns operational or degraded with caching headers", async () => {
  const response = await GET();
  assert.equal(response.status, 200);

  const cacheControl = response.headers.get("cache-control");
  assert.ok(cacheControl, "Response should have cache-control header");
  assert.match(cacheControl, /public/);
  assert.match(cacheControl, /s-maxage=5/);
  assert.match(cacheControl, /stale-while-revalidate=10/);

  const body = await response.json();
  assert.ok(["operational", "degraded"].includes(body.status));
  assert.ok(Array.isArray(body.components));
  assert.equal(body.components.length, 4);
});

test("landing page exports ISR revalidate interval", () => {
  assert.equal((landingPage as { revalidate?: number }).revalidate, 3600);
});

test("public llms.txt exists and specifies essential agent guidance", () => {
  const llmsPath = path.resolve(process.cwd(), "public/llms.txt");
  assert.ok(fs.existsSync(llmsPath), "public/llms.txt must exist");
  const content = fs.readFileSync(llmsPath, "utf8");
  assert.match(content, /# Authab/);
  assert.match(content, /\/docs/);
  assert.match(content, /\/api\/status/);
});

test(".gitleaksignore contains verified whitelist fingerprints", () => {
  const ignorePath = path.resolve(process.cwd(), ".gitleaksignore");
  assert.ok(fs.existsSync(ignorePath), ".gitleaksignore must exist");
  const content = fs.readFileSync(ignorePath, "utf8");
  assert.match(content, /tests\/secret-patterns\.test\.ts/);
  assert.match(content, /tests\/identity-document\.test\.ts/);
  assert.match(content, /\.env\.example/);
});
