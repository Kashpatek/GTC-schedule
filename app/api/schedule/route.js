import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "sail-schedule-data";
const DEFAULT = { cells: {}, notes: {}, lastUpdated: null, updatedBy: null };

export async function GET() {
  try {
    const data = await redis.get(KEY);
    return Response.json(data || DEFAULT);
  } catch (e) {
    console.error("GET error:", e);
    return Response.json(DEFAULT);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await redis.set(KEY, data);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
