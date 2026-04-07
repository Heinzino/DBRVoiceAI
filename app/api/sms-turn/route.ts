import { NextResponse } from "next/server";
import { z } from "zod";
import { openrouter, MODEL } from "@/lib/ai";
import { salespersonSystemPrompt, openingMessage } from "@/lib/prompts";
import { verifySession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Message = z.object({
  role: z.enum(["rep", "lead"]),
  text: z.string(),
});

const Body = z.object({
  session: z.string(),
  history: z.array(Message),
});

export async function POST(req: Request) {
  try {
    const { session, history } = Body.parse(await req.json());
    const s = await verifySession(session);

    const prospectFirstName = s.name.split(" ")[0];

    // Map our UI roles to OpenAI chat roles: rep=assistant, lead=user.
    const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: salespersonSystemPrompt(s.scrape, prospectFirstName) },
    ];

    // First message is hardcoded — no LLM call needed.
    if (history.length === 0) {
      return NextResponse.json({
        message: openingMessage(s.scrape.companyName, prospectFirstName),
      });
    } else {
      for (const m of history) {
        chatMessages.push({
          role: m.role === "rep" ? "assistant" : "user",
          content: m.text,
        });
      }
      // Ensure conversation starts with a user turn after system.
      if (chatMessages[1]?.role !== "user") {
        chatMessages.splice(1, 0, { role: "user", content: "(silence)" });
      }
    }

    const res = await openrouter().chat.completions.create({
      model: MODEL,
      max_tokens: 200,
      messages: chatMessages,
    });

    const text = res.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "")
      ?? "hey, still there?";

    return NextResponse.json({ message: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/sms-turn]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
