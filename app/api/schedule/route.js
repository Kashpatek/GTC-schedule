import { kv } from "@vercel/kv";

const KEY = "sail-schedule-data";
const DEFAULT = { cells: {}, notes: {}, lastUpdated: null, updatedBy: null };

export async function GET() {
  try {
    const data = await kv.get(KEY);
    return Response.json(data || DEFAULT);
  } catch {
    return Response.json(DEFAULT);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await kv.set(KEY, data);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
