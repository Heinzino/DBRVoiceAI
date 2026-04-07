import { notFound } from "next/navigation";
import SmsDemo from "@/components/SmsDemo";
import { verifySession } from "@/lib/session";

type Params = Promise<{ session: string }>;

export default async function DemoPage({ params }: { params: Params }) {
  const { session } = await params;
  let data;
  try {
    data = await verifySession(session);
  } catch {
    notFound();
  }

  const firstName = data.name.split(/\s+/)[0] || data.name;

  return (
    <SmsDemo
      session={session}
      prospectFirstName={firstName}
      companyName={data.scrape.companyName}
      logoUrl={data.scrape.logoUrl}
    />
  );
}
