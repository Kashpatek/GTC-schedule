import { put, list } from "@vercel/blob";

const BLOB_PATH = "sail-schedule-data.json";
const DEFAULT = { cells: {}, notes: {}, lastUpdated: null, updatedBy: null };

export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    if (blobs.length === 0) return Response.json(DEFAULT);
    const res = await fetch(blobs[0].url);
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    console.error("GET error:", e);
    return Response.json(DEFAULT);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await put(BLOB_PATH, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
