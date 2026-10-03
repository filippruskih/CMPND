import { NextResponse } from "next/server";
import { discoverNicheAccounts } from "@/lib/instagram/discover-accounts";

export async function POST() {
  try {
    const accounts = await discoverNicheAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to discover accounts";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
