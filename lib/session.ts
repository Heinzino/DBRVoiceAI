import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { ScrapeSchema } from "./scrape";

export const SessionSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  website: z.string().url(),
  scrape: ScrapeSchema,
  ghlContactId: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to 16+ chars");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(session: Session): Promise<string> {
  return await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<Session> {
  const { payload } = await jwtVerify(token, secretKey());
  return SessionSchema.parse(payload);
}
