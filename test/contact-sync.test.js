import assert from "node:assert/strict";
import test from "node:test";

import { planContactSync } from "../src/services/contact-sync.js";

test("creates a normalized contact", () => {
  const result = planContactSync([{
    externalId: "crm-1",
    email: " ANA@Example.COM ",
    name: " Ana   Ruiz ",
    updatedAt: "2026-01-01T10:00:00Z",
  }], []);

  assert.deepEqual(result.creates, [{
    externalId: "crm-1",
    email: "ana@example.com",
    name: "Ana Ruiz",
    sourceUpdatedAt: "2026-01-01T10:00:00Z",
  }]);
});

test("updates a contact and preserves its database id", () => {
  const result = planContactSync([{
    externalId: "crm-2",
    email: "bob@example.com",
    name: "Bob New",
    updatedAt: "2026-02-01T10:00:00Z",
  }], [{
    id: "db-9",
    email: "BOB@example.com",
    name: "Bob Old",
    sourceUpdatedAt: "2026-01-01T10:00:00Z",
  }]);

  assert.equal(result.updates[0]?.id, "db-9");
  assert.equal(result.updates[0]?.name, "Bob New");
});

test("keeps the later duplicate when timestamps are equal", () => {
  const result = planContactSync([
    {
      externalId: "first",
      email: "case@example.com",
      name: "First",
      updatedAt: "2026-03-01T10:00:00Z",
    },
    {
      externalId: "second",
      email: " CASE@example.com ",
      name: "Second",
      updatedAt: "2026-03-01T10:00:00Z",
    },
  ], []);

  assert.equal(result.creates.length, 1);
  assert.equal(result.creates[0]?.externalId, "second");
});

test("rejects invalid input", () => {
  const invalid = {
    externalId: "crm-4",
    email: "not-an-email",
    name: "Nobody",
    updatedAt: "not-a-date",
  };
  const result = planContactSync([invalid], []);

  assert.deepEqual(result.rejected, [
    { input: invalid, reason: "email is invalid" },
  ]);
});

test("skips a contact that is not newer", () => {
  const result = planContactSync([{
    externalId: "crm-5",
    email: "same@example.com",
    name: "Same Person",
    updatedAt: "2026-01-01T10:00:00Z",
  }], [{
    id: "db-5",
    email: "same@example.com",
    name: "Same Person",
    sourceUpdatedAt: "2026-01-01T10:00:00Z",
  }]);

  assert.deepEqual(result.skipped, [{
    email: "same@example.com",
    reason: "incoming contact is not newer",
  }]);
});
