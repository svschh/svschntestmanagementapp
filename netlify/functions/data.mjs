import { getStore } from "@netlify/blobs";

// Zentraler, automatischer Speicher fuer den Teststand.
// GET  -> liefert den aktuellen Stand (oder null, falls noch nichts gespeichert wurde)
// POST -> speichert den mitgeschickten Stand fuer alle
export default async (req) => {
  const store = getStore("testcase-cockpit");

  if (req.method === "GET") {
    const data = await store.get("state", { type: "json" });
    return new Response(JSON.stringify(data ?? null), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    await store.setJSON("state", body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/data" };
