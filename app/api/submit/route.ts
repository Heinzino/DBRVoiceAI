import { NextResponse } from "next/server";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { scrapeAndExtract } from "@/lib/scrape";
import { upsertContact } from "@/lib/ghl";
import { signSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(30).optional(),
  website: z.string().min(3),
});

function normalizeUrl(input: string): string {
  try {
    const u = new URL(input.startsWith("http") ? input : `https://${input}`);
    return u.toString();
  } catch {
    throw new Error("invalid website URL");
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = Body.parse(json);

    let phoneNumber = "";
    if (parsed.phone) {
      const phone = parsePhoneNumberFromString(parsed.phone, "US");
      if (!phone || !phone.isValid()) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      phoneNumber = phone.number;
    }

    const website = normalizeUrl(parsed.website);

    const scrape = await scrapeAndExtract(website);

    const ghlContactId = await upsertContact({
      name: parsed.name,
      email: parsed.email,
      phone: phoneNumber,
      website,
      scrape,
    });

    const token = await signSession({
      name: parsed.name,
      email: parsed.email,
      phone: phoneNumber,
      website,
      scrape,
      ghlContactId,
    });

    return NextResponse.json({ redirect: `/demo/${token}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/submit]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
