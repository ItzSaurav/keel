import "./helpers/test-env";
import assert from "node:assert/strict";
import test from "node:test";
import { crossOrgActorName } from "../src/lib/actor-name";

test("cross-org actors use one canonical audit name", () => {
  assert.equal(crossOrgActorName("Researcher", "Acme Health"), "Researcher (via Acme Health)");
  assert.equal(crossOrgActorName("Researcher (Acme Health)", "Acme Health"), "Researcher (via Acme Health)");
  assert.equal(crossOrgActorName("Researcher (via Acme Health)", "Acme Health"), "Researcher (via Acme Health)");
  assert.equal(crossOrgActorName("Researcher (Old Org)", "Acme Health"), "Researcher (Old Org) (via Acme Health)");
});

test("internal agents and empty names stay readable", () => {
  assert.equal(crossOrgActorName("Atlas", null), "Atlas");
  assert.equal(crossOrgActorName("  Atlas  ", undefined), "Atlas");
  assert.equal(crossOrgActorName("", null), "Agent");
  assert.equal(crossOrgActorName(null, "Acme Health"), "External agent (via Acme Health)");
});

test("organization names are matched literally, not as regex syntax", () => {
  assert.equal(
    crossOrgActorName("Researcher (Acme (Labs))", "Acme (Labs)"),
    "Researcher (via Acme (Labs))",
  );
});
