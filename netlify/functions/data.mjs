import { getStore } from "@netlify/blobs";

// Zentraler, automatischer Speicher fuer den Teststand, mit einfacher
// Versionspruefung: ein Speichervorgang wird nur uebernommen, wenn er
// auf dem zuletzt bekannten Stand aufbaut. So verhindern wir, dass ein
// veralteter Browser-Tab neuere Aenderungen eines anderen Teammitglieds
// versehentlich ueberschreibt.
const NO_STORE = { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" };

export default async (req) => {
  const store = getStore("testcase-cockpit");

  if (req.method === "GET") {
    const record = (await store.get("state", { type: "json" })) || { version: 0, data: null };
    return new Response(JSON.stringify(record), { headers: NO_STORE });
  }

  if (req.method === "POST") {
    const incoming = await req.json(); // { baseVersion, data }
    const current = (await store.get("state", { type: "json" })) || { version: 0, data: null };

    if (typeof incoming.baseVersion === "number" && incoming.baseVersion !== current.version) {
      // Jemand anderes hat zwischenzeitlich gespeichert -> ablehnen, Client gleicht ab und versucht erneut
      return new Response(JSON.stringify({ conflict: true, version: current.version, data: current.data }), {
        status: 409,
        headers: NO_STORE
      });
    }

    const next = { version: current.version + 1, data: incoming.data };
    await store.setJSON("state", next);
    return new Response(JSON.stringify({ ok: true, version: next.version }), { headers: NO_STORE });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/data" };
