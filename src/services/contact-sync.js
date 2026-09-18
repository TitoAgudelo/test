const normalizeEmail = (email) => email.trim().toLowerCase();

const normalizeName = (name) => name.trim().replace(/\s+/g, " ");

function isValidEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  const domainParts = domain.split(".");
  const hasWhitespace = [...email].some((character) => !character.trim());

  return (
    Boolean(local) &&
    domainParts.length >= 2 &&
    domainParts.every(Boolean) &&
    !hasWhitespace
  );
}

function validate(contact) {
  if (typeof contact.email !== "string" || !contact.email.trim()) {
    return "email is required";
  }
  if (!isValidEmail(normalizeEmail(contact.email))) {
    return "email is invalid";
  }
  if (typeof contact.name !== "string" || !contact.name.trim()) {
    return "name is required";
  }
  if (
    typeof contact.updatedAt !== "string" ||
    !contact.updatedAt.trim() ||
    !Number.isFinite(Date.parse(contact.updatedAt))
  ) {
    return "updatedAt is invalid";
  }
}

export function planContactSync(incoming, existing) {
  const plan = {
    creates: [],
    updates: [],
    skipped: [],
    rejected: [],
  };

  const newestByEmail = new Map();

  for (const contact of incoming) {
    const reason = validate(contact);
    if (reason) {
      plan.rejected.push({ input: contact, reason });
      continue;
    }

    const email = normalizeEmail(contact.email);
    const timestamp = Date.parse(contact.updatedAt);
    const current = newestByEmail.get(email);

    // Replacing equal timestamps makes the later input record win.
    if (!current || timestamp >= current.timestamp) {
      newestByEmail.set(email, { contact, timestamp });
    }
  }

  const existingByEmail = new Map(
    existing.map((contact) => [normalizeEmail(contact.email), contact]),
  );

  for (const [email, selected] of newestByEmail) {
    const stored = existingByEmail.get(email);
    const contactToWrite = {
      externalId: selected.contact.externalId,
      email,
      name: normalizeName(selected.contact.name),
      sourceUpdatedAt: selected.contact.updatedAt,
    };

    if (!stored) {
      plan.creates.push(contactToWrite);
    } else if (selected.timestamp > Date.parse(stored.sourceUpdatedAt)) {
      plan.updates.push({ ...contactToWrite, id: stored.id });
    } else {
      plan.skipped.push({ email, reason: "incoming contact is not newer" });
    }
  }

  const byEmail = (a, b) => a.email.localeCompare(b.email);

  plan.creates.sort(byEmail);
  plan.updates.sort(byEmail);
  plan.skipped.sort(byEmail);
  plan.rejected.sort((a, b) => {
    const aEmail = typeof a.input.email === "string"
      ? normalizeEmail(a.input.email)
      : "";
    const bEmail = typeof b.input.email === "string"
      ? normalizeEmail(b.input.email)
      : "";
    return aEmail.localeCompare(bEmail);
  });

  return plan;
}

export default planContactSync;
