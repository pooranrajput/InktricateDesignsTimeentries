import React, { useState, useEffect, useRef } from "react";

const C = {
  sage: "#8A9A5B",
  sageSoft: "#B7C293",
  forest: "#2F4A3C",
  mint: "#EDF2E6",
  cream: "#FAF9F3",
  charcoal: "#2B2B2B",
  muted: "#6E7267",
  line: "#DCE3D0",
};

const STAGES = ["Not started", "In design", "In production", "Ready", "Packed"];
const STAGE_STYLE = [
  { bg: C.mint, fg: C.forest },
  { bg: "#DCE5C6", fg: C.forest },
  { bg: C.sageSoft, fg: C.forest },
  { bg: C.sage, fg: "#ffffff" },
  { bg: C.forest, fg: "#ffffff" },
];
const DONE = STAGES.length - 1;

const seedEvent = {
  id: "306",
  client: "Rajitha + Ambar",
  invoice: "306",
  eventDate: "2026-08-22",
  venues: [
    {
      name: "Home Puja",
      items: [
        { id: "a1", name: "Lotus Theme Welcome Sign", qty: 1, spec: "3ft x 7ft, 3D lotuses, irregular shape (not rectangle)", stage: 0, oversized: true },
        { id: "a2", name: "Lotus Shape Food Station Signs", qty: 20, spec: "Acrylic, water-lily silhouette", stage: 0, dependency: "Floral arrangement from Design House" },
        { id: "a3", name: "Lotus Thank You Cards", qty: 480, spec: "Sculpted embossed", stage: 0 },
        { id: "a4", name: "Gold Foil Coasters", qty: 480, spec: "", stage: 0 },
        { id: "a5", name: "Passed App Signs", qty: 36, spec: "", stage: 0 },
      ],
    },
    {
      name: "Plaza",
      items: [
        { id: "b1", name: "Cocktail Hour Food Station Signs", qty: 3, spec: "Double layer, translucent burgundy + silver acrylic (printed)", stage: 0 },
        { id: "b2", name: "Table Numbers", qty: 43, spec: "Floating acrylic, clear + silver", stage: 0 },
        { id: "b3", name: "Velvet Jacket + Silver Paper Menus", qty: 340, spec: "Double layered", stage: 0 },
        { id: "b4", name: "Welcome Bags", qty: 125, spec: "Custom illustrations", stage: 0 },
        { id: "b5", name: "Purse Envelopes", qty: 230, spec: "", stage: 0, verify: true },
        { id: "b6", name: "Seating Chart", qty: 1, spec: "", stage: 0, oversized: true },
        { id: "b7", name: "Cocktail Hour Passed App Signs", qty: 19, spec: "", stage: 0 },
        { id: "b8", name: "Cocktail Signs", qty: 6, spec: "", stage: 0 },
      ],
    },
  ],
  services: ["Delivery / setup / breakdown - Home Puja", "Delivery / setup / breakdown - Plaza"],
  kit: {},
};

const CREW_KIT = {
  "Mounting and install": [
    "Easels sized to each freestanding sign",
    "Standoffs, caps, hex key",
    "Command strips and double-sided VHB tape",
    "Zip ties, fishing line, S-hooks",
    "Level, tape measure, step stool",
  ],
  "Handling and protection": [
    "Cotton or nitrile gloves (acrylic fingerprints)",
    "Microfiber cloths and anti-static acrylic cleaner",
    "Foam sheets between acrylic panels",
    "Corner protectors for oversized panels",
    "Blankets for the welcome sign and seating chart",
  ],
  "Repair and backup": [
    "Vinyl scraps and transfer tape for on-site fixes",
    "Spare table number blanks",
    "Extra menus and cards (5% overage)",
    "Adhesive remover, X-acto, scissors",
    "Touch-up pens matching gold foil and silver",
  ],
  "Site and paperwork": [
    "Printed floor plan with sign placement",
    "Planner and venue contact sheet",
    "Signed contract and invoice copy",
    "Load-in time, dock, and elevator details",
    "Phone charger and power bank",
  ],
};

const STORE_KEY = "inktricate-loadout-v1";

export default function LoadOut() {
  const [event, setEvent] = useState(seedEvent);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pack");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY, false);
        if (r && r.value) setEvent(JSON.parse(r.value));
      } catch (e) {
        console.log("No saved load-out yet");
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setEvent(next);
    try {
      await window.storage.set(STORE_KEY, JSON.stringify(next), false);
    } catch (e) {
      console.error("Could not save", e);
    }
  };

  const bump = (vi, id, dir) => {
    const next = JSON.parse(JSON.stringify(event));
    const it = next.venues[vi].items.find((x) => x.id === id);
    it.stage = Math.max(0, Math.min(DONE, it.stage + dir));
    persist(next);
  };

  const toggleKit = (line) => {
    const next = JSON.parse(JSON.stringify(event));
    next.kit = next.kit || {};
    next.kit[line] = !next.kit[line];
    persist(next);
  };

  const resetAll = () => {
    const next = JSON.parse(JSON.stringify(event));
    next.venues.forEach((v) => v.items.forEach((i) => (i.stage = 0)));
    next.kit = {};
    persist(next);
  };

  const pieces = (items, filter) =>
    items.filter(filter || (() => true)).reduce((s, i) => s + (Number(i.qty) || 0), 0);

  const allItems = event.venues.flatMap((v) => v.items);
  const totalPieces = pieces(allItems);
  const packedPieces = pieces(allItems, (i) => i.stage === DONE);

  const daysOut = (() => {
    const d = Math.ceil((new Date(event.eventDate) - new Date("2026-08-14")) / 86400000);
    return isNaN(d) ? null : d;
  })();

  async function handlePdf(file) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Could not read that file"));
        r.readAsDataURL(file);
      });
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
                {
                  type: "text",
                  text:
                    "This is a wedding stationery and signage contract or invoice. Extract a packing manifest. Section headers wrapped in asterisks (for example ****Plaza****) are venue groupings: every line item after one belongs to it until the next header. Skip the zero-quantity header rows themselves. File delivery, setup and breakdown lines as services, not packable items.\n\nReturn ONLY raw JSON, no markdown fence and no preamble:\n{\"client\":\"\",\"invoice\":\"\",\"eventDate\":\"YYYY-MM-DD or empty string\",\"venues\":[{\"name\":\"\",\"items\":[{\"name\":\"\",\"qty\":0,\"spec\":\"short physical description\",\"oversized\":false,\"dependency\":\"\"}]}],\"services\":[]}",
                },
              ],
            },
          ],
        }),
      });
      const data = await resp.json();
      const text = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      let n = 0;
      parsed.venues.forEach((v) =>
        v.items.forEach((i) => {
          i.id = "x" + n++;
          i.stage = 0;
          i.qty = Number(i.qty) || 1;
        })
      );
      persist({ ...parsed, id: parsed.invoice || "new", kit: {} });
      setTab("pack");
    } catch (e) {
      setErr("Couldn't read that contract. Check it's a Dubsado PDF export, then try again.");
    }
    setBusy(false);
  }

  const copyManifest = () => {
    const lines = [event.client + " - load-out manifest", ""];
    event.venues.forEach((v) => {
      lines.push(v.name.toUpperCase() + " - " + pieces(v.items) + " pieces");
      v.items.forEach((i) =>
        lines.push("  [" + (i.stage === DONE ? "x" : " ") + "] " + i.qty + " x " + i.name + (i.spec ? " - " + i.spec : ""))
      );
      lines.push("");
    });
    if (navigator.clipboard) navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div style={{ background: C.cream, color: C.muted }} className="p-8 text-sm">
        Loading your load-out
      </div>
    );

  return (
    <div style={{ background: C.cream, color: C.charcoal }} className="min-h-screen">
      <header style={{ background: C.sage }} className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div style={{ color: C.forest, letterSpacing: "0.18em" }} className="text-xs font-semibold uppercase mb-2">
            Inktricate Designs / Load-out
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", color: "#ffffff" }} className="text-3xl sm:text-4xl leading-tight">
            {event.client}
          </h1>
          <div style={{ color: C.forest }} className="mt-3 text-sm flex flex-wrap gap-x-5 gap-y-1">
            <span>Invoice #{event.invoice}</span>
            {daysOut !== null && daysOut >= 0 && <span className="font-semibold">{daysOut} days out</span>}
            <span>
              {packedPieces.toLocaleString()} of {totalPieces.toLocaleString()} pieces packed
            </span>
          </div>
        </div>
      </header>

      <nav style={{ borderColor: C.line }} className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 flex gap-1">
          {[
            ["pack", "Packing list"],
            ["kit", "Crew kit"],
            ["new", "New contract"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                color: tab === k ? C.forest : C.muted,
                borderColor: tab === k ? C.forest : "transparent",
                letterSpacing: "0.08em",
              }}
              className="px-3 py-3 text-xs font-semibold uppercase border-b-2"
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
        {tab === "pack" && (
          <div>
            {event.venues.map((v, vi) => {
              const vTotal = pieces(v.items);
              const vPacked = pieces(v.items, (i) => i.stage === DONE);
              const pct = vTotal ? Math.round((vPacked / vTotal) * 100) : 0;
              return (
                <section key={v.name} className="mb-10">
                  <div className="flex items-baseline justify-between mb-1">
                    <h2 style={{ color: C.forest, letterSpacing: "0.14em" }} className="text-sm font-bold uppercase">
                      {v.name}
                    </h2>
                    <span style={{ color: C.muted }} className="text-xs tabular-nums">
                      {vPacked.toLocaleString()} / {vTotal.toLocaleString()} pieces
                    </span>
                  </div>
                  <div style={{ background: C.mint, borderColor: C.line }} className="h-2 w-full rounded-sm overflow-hidden border mb-4">
                    <div style={{ background: C.forest, width: pct + "%" }} className="h-full transition-all duration-500" />
                  </div>

                  <div style={{ borderColor: C.line }} className="border rounded-md bg-white divide-y">
                    {v.items.map((it) => (
                      <div key={it.id} style={{ borderColor: C.line }} className="p-4 flex gap-4 items-start">
                        <div
                          style={{ color: it.stage === DONE ? C.forest : C.charcoal }}
                          className="text-lg font-semibold tabular-nums w-14 shrink-0"
                        >
                          {Number(it.qty).toLocaleString()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            style={{ color: it.stage === DONE ? C.muted : C.charcoal }}
                            className={"font-medium " + (it.stage === DONE ? "line-through" : "")}
                          >
                            {it.name}
                          </div>
                          {it.spec ? (
                            <div style={{ color: C.muted }} className="text-sm mt-0.5">
                              {it.spec}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {it.oversized && <Tag label="Oversized: blanket and van space" />}
                            {it.dependency ? <Tag label={"Waiting on: " + it.dependency} warn /> : null}
                            {it.verify && <Tag label="Confirm which venue" warn />}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => bump(vi, it.id, -1)}
                              disabled={it.stage === 0}
                              style={{ borderColor: C.line, color: C.muted }}
                              className="border rounded w-7 h-7 text-sm disabled:opacity-30"
                              aria-label="Move back a stage"
                            >
                              -
                            </button>
                            <span
                              style={{
                                background: STAGE_STYLE[it.stage].bg,
                                color: STAGE_STYLE[it.stage].fg,
                                letterSpacing: "0.06em",
                              }}
                              className="text-xs font-semibold uppercase px-3 py-1.5 rounded min-w-32 text-center"
                            >
                              {STAGES[it.stage]}
                            </span>
                            <button
                              onClick={() => bump(vi, it.id, 1)}
                              disabled={it.stage === DONE}
                              style={{ borderColor: C.forest, color: C.forest }}
                              className="border rounded w-7 h-7 text-sm disabled:opacity-30"
                              aria-label="Advance a stage"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {event.services && event.services.length > 0 ? (
              <section style={{ background: C.mint, borderColor: C.line }} className="border rounded-md p-4 mb-6">
                <h3 style={{ color: C.forest, letterSpacing: "0.14em" }} className="text-xs font-bold uppercase mb-2">
                  Day-of services: scheduled, not packed
                </h3>
                <ul style={{ color: C.muted }} className="text-sm space-y-1">
                  {event.services.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button onClick={copyManifest} style={{ background: C.forest }} className="text-white text-sm px-4 py-2 rounded">
                {copied ? "Copied" : "Copy manifest for the crew"}
              </button>
              <button onClick={resetAll} style={{ borderColor: C.line, color: C.muted }} className="border text-sm px-4 py-2 rounded">
                Reset progress
              </button>
            </div>
          </div>
        )}

        {tab === "kit" && (
          <div>
            <p style={{ color: C.muted }} className="text-sm mb-6 max-w-xl">
              None of this is on the invoice, and all of it sinks an install if it stays in Parlin. Check it the
              night before load-out.
            </p>
            {Object.entries(CREW_KIT).map(([group, lines]) => (
              <section key={group} className="mb-7">
                <h2 style={{ color: C.forest, letterSpacing: "0.14em" }} className="text-sm font-bold uppercase mb-3">
                  {group}
                </h2>
                <div style={{ borderColor: C.line }} className="border rounded-md bg-white divide-y">
                  {lines.map((line) => (
                    <label key={line} style={{ borderColor: C.line }} className="flex items-center gap-3 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!(event.kit && event.kit[line])}
                        onChange={() => toggleKit(line)}
                        style={{ accentColor: C.forest }}
                        className="w-4 h-4"
                      />
                      <span
                        style={{ color: event.kit && event.kit[line] ? C.muted : C.charcoal }}
                        className={"text-sm " + (event.kit && event.kit[line] ? "line-through" : "")}
                      >
                        {line}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === "new" && (
          <div className="max-w-xl">
            <h2 style={{ color: C.forest, letterSpacing: "0.14em" }} className="text-sm font-bold uppercase mb-3">
              Start from a Dubsado contract
            </h2>
            <p style={{ color: C.muted }} className="text-sm mb-5">
              Upload the PDF export. Line items get read into venue groups, quantities become piece counts, and
              delivery lines are filed as services. This replaces the event currently open.
            </p>
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              disabled={busy}
              style={{ background: busy ? C.sageSoft : C.forest }}
              className="text-white text-sm px-4 py-2 rounded"
            >
              {busy ? "Reading contract" : "Choose PDF"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handlePdf(e.target.files && e.target.files[0])}
            />
            {err ? (
              <p style={{ color: "#8B3A2E" }} className="text-sm mt-4">
                {err}
              </p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

function Tag({ label, warn }) {
  return (
    <span
      style={{
        background: warn ? "#F6EDD9" : C.mint,
        color: warn ? "#7A5A1E" : C.forest,
        letterSpacing: "0.04em",
      }}
      className="text-xs px-2 py-1 rounded"
    >
      {label}
    </span>
  );
}
