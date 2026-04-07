import OptInForm from "@/components/OptInForm";

type SearchParams = Promise<{ name?: string; email?: string; website?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const name = sp.name ?? "";
  const email = sp.email ?? "";
  const website = sp.website ?? "";

  return (
    <main className="min-h-svh w-full bg-neutral-50">
      <div className="mx-auto grid min-h-svh w-full max-w-[1400px] grid-cols-1 p-3 sm:p-4 md:grid-cols-2 md:gap-6 md:p-6">
        {/* Left: image + headline — hidden on mobile */}
        <section className="relative hidden overflow-hidden rounded-3xl md:block">
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: "url('/formPhoto.avif')",
              backgroundSize: "auto 100%",
              backgroundPosition: "15% center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
          <div className="relative flex h-full flex-col justify-end p-10 text-white">
            <div>
              <h1 className="font-serif text-5xl leading-[1.05] tracking-tight lg:text-6xl">
                Your coldest lead
                <br />
                just{" "}
                <span className="italic text-emerald-300">came back</span>
                <br />
                to life.
              </h1>
            </div>
          </div>
        </section>

        {/* Right: form card */}
        <section className="flex items-center justify-center rounded-2xl bg-white px-5 py-8 shadow-sm sm:rounded-3xl sm:px-8 md:p-14">
          <OptInForm initialName={name} initialEmail={email} initialWebsite={website} />
        </section>
      </div>
    </main>
  );
}
