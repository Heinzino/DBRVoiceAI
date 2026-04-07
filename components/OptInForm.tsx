"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialName: string;
  initialEmail: string;
  initialWebsite: string;
};

export default function OptInForm({ initialName, initialEmail, initialWebsite }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [website, setWebsite] = useState(initialWebsite);
  // const phoneRef = useRef<HTMLInputElement>(null);
  // const [phone, setPhone] = useState("");
  // const [country, setCountry] = useState<"US" | "CA">("US");

  // useEffect(() => {
  //   phoneRef.current?.focus();
  // }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // // Canadian area codes (non-exhaustive but covers all assigned)
  // const CA_AREA_CODES = new Set([
  //   "204","226","236","249","250","263","289","306","343","354","365","367",
  //   "368","382","387","403","416","418","428","431","437","438","450","468",
  //   "474","506","514","519","548","579","581","584","587","600","604","613",
  //   "639","647","672","683","705","709","742","753","778","780","782","807",
  //   "819","825","867","873","879","902","905",
  // ]);

  // function handlePhoneChange(val: string) {
  //   setPhone(val);
  //   const digits = val.replace(/\D/g, "");
  //   if (digits.length >= 3) {
  //     const area = digits.slice(0, 3);
  //     setCountry(CA_AREA_CODES.has(area) ? "CA" : "US");
  //   }
  // }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          // phone,
          website: website.match(/^https?:\/\//) ? website : `https://${website}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      router.push(json.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-medium text-white">
            1
          </span>
          <span className="font-medium text-neutral-900">Your details</span>
          <span className="mx-2 h-px w-8 bg-neutral-300" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-[11px] font-medium text-neutral-400">
            2
          </span>
          <span>Live demo</span>
        </div>
      </div>

      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Experience the demo
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-neutral-500 sm:mb-8">
        We&apos;ll scan your site, build a live SMS demo personalized to your offer, and call your
        phone when the lead goes cold.
      </p>

      <div className="space-y-3 sm:space-y-4">
        <Field label="First Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="given-name"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white sm:py-3 sm:text-sm"
            placeholder="Jane"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white sm:py-3 sm:text-sm"
            placeholder="jane@agency.com"
          />
        </Field>
        <Field label="Website">
          <input
            inputMode="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            required
            autoComplete="url"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white sm:py-3 sm:text-sm"
            placeholder="yourdomain.com"
          />
        </Field>
        {/* Phone field — commented out for now, may bring back later
        <Field label="Phone">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 transition focus-within:border-neutral-900 focus-within:bg-white">
            <span className="flex items-center gap-1.5 border-r border-neutral-200 px-3 text-sm text-neutral-500">
              {country === "CA" ? (
                <svg viewBox="0 0 24 18" className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]" aria-label="CA flag">
                  <rect width="24" height="18" fill="#fff" />
                  <rect width="6" height="18" fill="#FF0000" />
                  <rect x="18" width="6" height="18" fill="#FF0000" />
                  <path d="M12 4 L13 8 L11 8 Z M10.5 8.5 L8 9.5 L9.5 8 Z M13.5 8.5 L16 9.5 L14.5 8 Z M11 10 L10 14 L12 12.5 L14 14 L13 10 Z" fill="#FF0000" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 18" className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]" aria-label="US flag">
                  <rect width="24" height="18" fill="#fff" />
                  {[0,2,4,6,8,10,12].map(i => <rect key={i} y={i * (18/13)} width="24" height={18/13} fill="#B22234" />)}
                  <rect width="9.6" height={7 * (18/13)} fill="#3C3B6E" />
                </svg>
              )}
              <span>+1</span>
            </span>
            <input
              ref={phoneRef}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
              autoComplete="tel-national"
              className="w-full bg-transparent px-4 py-3.5 text-base text-neutral-900 outline-none sm:py-3 sm:text-sm"
              placeholder="(555) 123-4567"
            />
          </div>
        </Field>
        */}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full cursor-pointer rounded-xl bg-neutral-900 px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-6"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Scanning your site…
          </span>
        ) : "Experience the demo →"}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-neutral-400">
        Your info is used only to personalize your demo. No spam, ever.
      </p>
      <p className="mt-1 text-center text-xs text-neutral-400">
        <a href="https://readymation.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600">Privacy Policy</a>
        {" · "}
        <a href="https://readymation.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600">Terms of Service</a>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}
