export async function createRetellCall(args: {
  toNumber: string;
  variables: {
    prospect_name: string;
    company_name: string;
    offer_hook: string;
    last_sms_context: string;
  };
}): Promise<{ callId: string }> {
  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;
  const fromNumber = process.env.RETELL_FROM_NUMBER;
  if (!apiKey || !agentId || !fromNumber) {
    console.warn("[retell] missing env — simulating call");
    return { callId: `sim-${Date.now()}` };
  }

  const res = await fetch("https://api.retellai.com/v2/create-phone-call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_number: fromNumber,
      to_number: args.toNumber,
      override_agent_id: agentId,
      retell_llm_dynamic_variables: args.variables,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Retell call failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { call_id?: string };
  return { callId: json.call_id ?? "unknown" };
}
