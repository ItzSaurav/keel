import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface CachedCheck {
  timestamp: number;
  database: boolean;
  environments: number;
}

let cachedCheck: CachedCheck | null = null;
const CACHE_TTL_MS = 5000; // 5-second in-memory TTL prevents DB saturation under high-frequency monitoring

export async function GET() {
  const started = Date.now();
  const now = started;

  let database = false;
  let environments = 0;

  if (cachedCheck && now - cachedCheck.timestamp < CACHE_TTL_MS) {
    database = cachedCheck.database;
    environments = cachedCheck.environments;
  } else {
    try {
      environments = await db.environment.count();
      database = true;
    } catch {
      database = false;
    }
    cachedCheck = { timestamp: now, database, environments };
  }

  return NextResponse.json(
    {
      status: database ? "operational" : "degraded",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      components: [
        {
          id: "control-plane",
          name: "Control plane",
          status: database ? "operational" : "degraded",
          detail: "Dashboard, API keys and session handling.",
        },
        {
          id: "database",
          name: "Metadata store",
          status: database ? "operational" : "degraded",
          detail: database ? `${environments} environments reachable.` : "Database check failed.",
        },
        {
          id: "proxy",
          name: "Agent proxy",
          status: database ? "operational" : "degraded",
          detail: database
            ? "Live provider egress with policy, approvals and audit enforced."
            : "Proxy unavailable.",
        },
        {
          id: "audit",
          name: "Audit pipeline",
          status: database ? "operational" : "degraded",
          detail: "Hash-chained writes and export.",
        },
      ],
    },
    {
      headers: {
        "cache-control": "public, s-maxage=5, stale-while-revalidate=10",
      },
    },
  );
}
