import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/session";
import { createRetellCall } from "@/lib/retell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Message = z.object({
  role: z.enum(["rep", "lead"]),
  text: z.string(),
});

const Body = z.object({
  session: z.string(),
  smsHistory: z.array(Message),
});

export async function POST(req: Request) {
  try {
    const { session, smsHistory } = Body.parse(await req.json());
    const s = await verifySession(session);

    const lastFew = smsHistory.slice(-6).map((m) => `${m.role}: ${m.text}`).join("\n");

    const { callId } = await createRetellCall({
      toNumber: s.phone,
      variables: {
        prospect_name: s.name.split(/\s+/)[0] || s.name,
        company_name: s.scrape.companyName,
        offer_hook: s.scrape.offerHook,
        last_sms_context: lastFew || "(no prior replies)",
      },
    });

    return NextResponse.json({ callId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/voice-call]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
