import * as cheerio from "cheerio";
import { z } from "zod";
import { openrouter, MODEL } from "./ai";
import { EXTRACTION_SYSTEM } from "./prompts";

export const ScrapeSchema = z.object({
  companyName: z.string().min(1),
  product: z.string().min(1),
  valueProp: z.string().min(1),
  painPoint: z.string().min(1),
  targetCustomer: z.string().min(1),
  tone: z.enum(["casual", "professional", "warm", "direct"]),
  offerHook: z.string().min(1),
  logoUrl: z.string().optional(),
});

export type Scrape = z.infer<typeof ScrapeSchema>;

const MAX_CHARS = 8000;

export async function fetchSiteText(url: string): Promise<{ text: string; logoUrl: string | undefined }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; VoiceLeadBot/1.0; +https://voice.demo)",
      },
    });
    if (!res.ok) throw new Error(`site returned ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract logo before stripping tags
    const origin = new URL(url).origin;
    const logoHref =
      $('link[rel="apple-touch-icon"]').attr("href") ??
      $('link[rel="icon"][type="image/png"]').attr("href") ??
      $('link[rel="icon"]').attr("href") ??
      $('link[rel="shortcut icon"]').attr("href");
    const logoUrl = logoHref
      ? logoHref.startsWith("http") ? logoHref : `${origin}${logoHref.startsWith("/") ? "" : "/"}${logoHref}`
      : `${origin}/favicon.ico`;

    $("script, style, noscript, nav, footer, svg").remove();
    const title = $("title").text().trim();
    const meta = $('meta[name="description"]').attr("content") ?? "";
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const composed = [title, meta, bodyText].filter(Boolean).join("\n\n");
    return { text: composed.slice(0, MAX_CHARS), logoUrl };
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractOffer(siteText: string, sourceUrl: string, logoUrl?: string): Promise<Scrape> {
  const res = await openrouter().chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM },
      { role: "user", content: `Source URL: ${sourceUrl}\n\nPage text:\n${siteText}` },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("no response from model");
  const raw = text.trim().replace(/^```json\s*|\s*```$/g, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("model returned invalid JSON");
  }
  const result = ScrapeSchema.parse(parsed);
  if (logoUrl) result.logoUrl = logoUrl;
  return result;
}

export async function scrapeAndExtract(url: string): Promise<Scrape> {
  const { text, logoUrl } = await fetchSiteText(url);
  if (text.length < 50) throw new Error("site returned too little content to analyze");
  return extractOffer(text, url, logoUrl);
}
