import type { Scrape } from "./scrape";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

type FieldMap = Partial<Record<keyof Scrape, string>>;

function fieldMap(): FieldMap {
  const raw = process.env.GHL_CUSTOM_FIELD_IDS ?? "{}";
  try {
    return JSON.parse(raw) as FieldMap;
  } catch {
    return {};
  }
}

export async function upsertContact(args: {
  name: string;
  email: string;
  phone: string;
  website: string;
  scrape: Scrape;
}): Promise<string> {
  const token = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    // Soft-fail: in dev we may not have GHL wired up. Log and return a synthetic id.
    console.warn("[ghl] GHL_PIT_TOKEN or GHL_LOCATION_ID missing — skipping upsert");
    return `local-${Date.now()}`;
  }

  const map = fieldMap();
  const customFields = (Object.keys(map) as (keyof Scrape)[])
    .map((k) => (map[k] ? { id: map[k]!, field_value: String(args.scrape[k]) } : null))
    .filter((x): x is { id: string; field_value: string } => x !== null);

  const [firstName, ...rest] = args.name.trim().split(/\s+/);
  const lastName = rest.join(" ");

  const body = {
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    email: args.email,
    phone: args.phone,
    website: args.website,
    locationId,
    customFields,
    source: "voice-lead-magnet",
  };

  const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL upsert failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { contact?: { id?: string }; id?: string };
  return json.contact?.id ?? json.id ?? "unknown";
}
