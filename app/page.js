"use client";
import { useState, useCallback, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SemiAnalysis × SAIL — GTC 2026 INTERVIEW SCHEDULE
   Vercel KV-backed shared storage · Drag & drop · Role toggle
   ═══════════════════════════════════════════════════════════════════════════ */

const TIERS = {
  1: { label: "Generalist / Big Picture", short: "GENERALIST", color: "#76B900", bg: "rgba(118,185,0,0.12)", border: "rgba(118,185,0,0.35)" },
  2: { label: "AI Infra & Software", short: "AI INFRA", color: "#1A84C6", bg: "rgba(26,132,198,0.12)", border: "rgba(26,132,198,0.35)" },
  3: { label: "Physical Infra & Hardware", short: "HARDWARE", color: "#E8A830", bg: "rgba(232,168,48,0.12)", border: "rgba(232,168,48,0.35)" },
};

const TEAM = [
  { id: "DP", name: "Dylan Patel", tier: 1 },
  { id: "JN", name: "Jordan Nanos", tier: 1 },
  { id: "CQ", name: "Cam Quilici", tier: 2 },
  { id: "KC", name: "Kimbo Chen", tier: 2 },
  { id: "HB", name: "Harrison Barclay", tier: 2 },
  { id: "BS", name: "Bryan Shan", tier: 2 },
  { id: "JO", name: "Jeremie Ontiveros", tier: [2, 3] },
  { id: "HW", name: "Howie Wong", tier: 3 },
  { id: "WG", name: "Wega", tier: 3 },
];

const DAYS = [
  { key: "sun", full: "SUNDAY", date: "MAR 15", sub: "" },
  { key: "mon", full: "MONDAY", date: "MAR 16", sub: "KEYNOTE DAY" },
  { key: "tue", full: "TUESDAY", date: "MAR 17", sub: "" },
  { key: "wed", full: "WEDNESDAY", date: "MAR 18", sub: "" },
  { key: "thu", full: "THURSDAY", date: "MAR 19", sub: "" },
];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const fmtH = (h) => (h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`);

const KEY_EVENTS = [
  { time: "MON 11 AM", event: "Jensen Huang Keynote", color: "#76B900", icon: "⚡" },
  { time: "MON 8 AM", event: "GTC Pregame Show", color: "#76B900", icon: "🎬" },
  { time: "WED 12:30 PM", event: "Open Models Panel", color: "#1A84C6", icon: "🔓" },
  { time: "SUN MAR 15", event: "Hackathon: Silicon to Scale", color: "#E8A830", icon: "🛠" },
];

const tierColor = (p) => TIERS[(Array.isArray(p.tier) ? p.tier : [p.tier])[0]].color;
const tierGrad = (p) => {
  const t = Array.isArray(p.tier) ? p.tier : [p.tier];
  return t.length > 1 ? `linear-gradient(135deg, ${TIERS[t[0]].color}, ${TIERS[t[1]].color})` : TIERS[t[0]].color;
};

// ─── API Storage ─────────────────────────────────────────────────────────────

const DEFAULT_DATA = { cells: {}, notes: {}, lastUpdated: null, updatedBy: null };

async function loadSchedule() {
  try {
    const res = await fetch("/api/schedule");
    if (!res.ok) throw new Error();
    return await res.json();
  } catch { return DEFAULT_DATA; }
}

async function saveSchedule(data) {
  try {
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) { console.error("Save failed:", e); }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InitialCircle({ person, size = 28, ringColor = null }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: tierGrad(person),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--mono)", fontSize: size * 0.36, fontWeight: 700,
      color: "#0a0a0a", flexShrink: 0,
      boxShadow: ringColor ? `0 0 0 2.5px ${ringColor}, 0 0 10px ${ringColor}40` : `0 0 8px ${tierColor(person)}30`,
      transition: "box-shadow 0.15s ease",
    }}>{person.id}</div>
  );
}

function RosterBadge({ person, count, onDragStart }) {
  const pc = tierColor(person);
  const t = Array.isArray(person.tier) ? person.tier : [person.tier];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ id: person.id, src: "roster" }));
        e.dataTransfer.effectAllowed = "copy";
        onDragStart();
      }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 12px 6px 6px", borderRadius: 10,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        cursor: "grab", transition: "all 0.15s ease", userSelect: "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = `${pc}40`; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "relative" }}>
        <InitialCircle person={person} size={32} />
        {count > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%",
            background: "var(--green)", color: "#000", fontFamily: "var(--mono)", fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          }}>{count}</div>
        )}
      </div>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 600, color: "#ddd", lineHeight: 1.2 }}>{person.name}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 8, fontWeight: 600, color: pc, letterSpacing: "0.08em", opacity: 0.8 }}>
          T{t.join("+")} · {TIERS[t[0]].short}
        </div>
      </div>
    </div>
  );
}

function CellBadge({ person, role, onToggle, onRemove, cellKey }) {
  const ringColor = role === "host" ? "#888" : "#ef4444";
  const [hov, setHov] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ id: person.id, src: "cell", from: cellKey }));
        e.dataTransfer.effectAllowed = "move"; e.stopPropagation();
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 6px 3px 3px", borderRadius: 8, cursor: "grab", position: "relative",
        transition: "all 0.12s ease", userSelect: "none",
        transform: hov ? "scale(1.04)" : "scale(1)",
        background: role === "host" ? "rgba(255,255,255,0.04)" : "rgba(239,68,68,0.08)",
        border: `1px solid ${role === "host" ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      <div onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}
        title={`Click → ${role === "host" ? "INTERVIEWED" : "HOSTING"}`}>
        <InitialCircle person={person} size={26} ringColor={ringColor} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: "var(--display)", fontSize: 10, fontWeight: 600, lineHeight: 1.2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          color: role === "host" ? "#ccc" : "#fca5a5",
        }}>{person.name.split(" ")[0]}</div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 7, fontWeight: 700, letterSpacing: "0.1em",
          color: role === "host" ? "#888" : "var(--red)",
        }}>{role === "host" ? "HOSTING" : "INTERVIEWED"}</div>
      </div>
      {hov && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{
          position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%",
          background: "var(--red)", border: "1px solid #b91c1c", color: "#fff",
          fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, lineHeight: 1, zIndex: 5,
        }}>×</button>
      )}
    </div>
  );
}

function NoteEditor({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const ref = useRef(null);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  useEffect(() => { setDraft(value || ""); }, [value]);

  if (editing) {
    return (
      <input ref={ref} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onChange(draft); }}
        onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onChange(draft); } if (e.key === "Escape") { setEditing(false); setDraft(value || ""); } }}
        placeholder="Add note..." maxLength={80}
        style={{
          width: "100%", padding: "2px 4px", borderRadius: 4,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
          color: "#aaa", fontFamily: "var(--mono)", fontSize: 8, outline: "none", position: "relative", zIndex: 2,
        }}
      />
    );
  }
  return (
    <div onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Click to edit note"
      style={{ fontFamily: "var(--mono)", fontSize: 8, color: "#555", cursor: "text", padding: "1px 2px", borderRadius: 3, position: "relative", zIndex: 2, marginTop: "auto", transition: "color 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}>
      {value ? value : <span style={{ opacity: 0.4 }}>+ note</span>}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function Page() {
  const [schedule, setSchedule] = useState(DEFAULT_DATA);
  const [dragOver, setDragOver] = useState(null);
  const [tierFilter, setTierFilter] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [syncPulse, setSyncPulse] = useState(false);

  // Load on mount
  useEffect(() => {
    (async () => { const d = await loadSchedule(); setSchedule(d); setLoaded(true); })();
  }, []);

  // Poll every 5s for changes from other users
  useEffect(() => {
    const iv = setInterval(async () => {
      const d = await loadSchedule();
      if (d.lastUpdated && d.lastUpdated !== schedule.lastUpdated) {
        setSchedule(d); setSyncPulse(true); setTimeout(() => setSyncPulse(false), 1500);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [schedule.lastUpdated]);

  const ensureName = useCallback(() => {
    if (!userName) { setShowNameModal(true); return false; } return true;
  }, [userName]);

  const persist = useCallback(async (newSchedule) => {
    const data = { ...newSchedule, lastUpdated: Date.now(), updatedBy: userName || "Unknown" };
    setSchedule(data);
    setSaving(true);
    await saveSchedule(data);
    setSaving(false);
  }, [userName]);

  // ─── Actions (all use schedule directly, persist sets state once) ──────────

  const addToCell = useCallback((ck, pid, role = "host") => {
    if (!ensureName()) return;
    const cell = schedule.cells[ck] || [];
    if (cell.find((p) => p.id === pid)) return;
    persist({ ...schedule, cells: { ...schedule.cells, [ck]: [...cell, { id: pid, role }] } });
  }, [ensureName, persist, schedule]);

  const removeFromCell = useCallback((ck, pid) => {
    const cell = (schedule.cells[ck] || []).filter((p) => p.id !== pid);
    const nc = { ...schedule.cells };
    if (cell.length === 0) delete nc[ck]; else nc[ck] = cell;
    persist({ ...schedule, cells: nc });
  }, [persist, schedule]);

  const toggleRole = useCallback((ck, pid) => {
    if (!ensureName()) return;
    const cell = (schedule.cells[ck] || []).map((p) =>
      p.id === pid ? { ...p, role: p.role === "host" ? "guest" : "host" } : p
    );
    persist({ ...schedule, cells: { ...schedule.cells, [ck]: cell } });
  }, [ensureName, persist, schedule]);

  const moveToCell = useCallback((from, to, pid) => {
    if (!ensureName()) return;
    const fc = schedule.cells[from] || [];
    const entry = fc.find((p) => p.id === pid);
    if (!entry) return;
    const nf = fc.filter((p) => p.id !== pid);
    const tc = schedule.cells[to] || [];
    if (tc.find((p) => p.id === pid)) return;
    const nc = { ...schedule.cells, [to]: [...tc, entry] };
    if (nf.length === 0) delete nc[from]; else nc[from] = nf;
    persist({ ...schedule, cells: nc });
  }, [ensureName, persist, schedule]);

  const setNote = useCallback((ck, note) => {
    if (!ensureName()) return;
    const nn = { ...schedule.notes };
    if (!note) delete nn[ck]; else nn[ck] = note;
    persist({ ...schedule, notes: nn });
  }, [ensureName, persist, schedule]);

  const handleDrop = useCallback((ck, e) => {
    e.preventDefault(); setDragOver(null);
    try {
      const d = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (d.src === "cell" && d.from) moveToCell(d.from, ck, d.id);
      else addToCell(ck, d.id);
    } catch {}
  }, [addToCell, moveToCell]);

  // Stats
  const counts = {};
  Object.values(schedule.cells).forEach((c) => c.forEach((p) => { counts[p.id] = (counts[p.id] || 0) + 1; }));
  const total = Object.values(schedule.cells).reduce((s, c) => s + c.length, 0);
  const lastTime = schedule.lastUpdated ? new Date(schedule.lastUpdated).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;

  // Loading state
  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #222", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#555", marginTop: 16, letterSpacing: "0.1em" }}>LOADING SCHEDULE...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "auto" }}>
      {/* BG */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(118,185,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(118,185,0,0.02) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -160, left: "50%", transform: "translateX(-50%)", width: 900, height: 350, background: "radial-gradient(ellipse, rgba(118,185,0,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Name modal */}
      {showNameModal && (
        <div onClick={() => setShowNameModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#151518", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, maxWidth: 380, width: "90%", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "#eee", marginBottom: 8 }}>Who&apos;s editing?</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#666", marginBottom: 20 }}>So the team knows who made changes</div>
            <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your name..." autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && userName.trim()) setShowNameModal(false); }}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#eee", fontFamily: "var(--display)", fontSize: 16, outline: "none", textAlign: "center", marginBottom: 14 }} />
            <button disabled={!userName.trim()} onClick={() => setShowNameModal(false)}
              style={{ padding: "10px 32px", borderRadius: 8, border: "none", background: "var(--green)", color: "#000", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", opacity: userName.trim() ? 1 : 0.4 }}>
              LET&apos;S GO
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1440, margin: "0 auto", padding: "20px 16px 48px" }}>
        {/* HEADER */}
        <header style={{ marginBottom: 16, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 36, height: 2.5, background: "var(--green)", borderRadius: 2 }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "var(--green)" }}>NVIDIA GTC 2026</span>
            <div style={{ width: 36, height: 2.5, background: "var(--green)", borderRadius: 2 }} />
          </div>
          <h1 style={{
            fontFamily: "var(--display)", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 4px",
            background: "linear-gradient(135deg, #fff 0%, var(--green) 45%, var(--blue) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>SemiAnalysis × SAIL</h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#555", letterSpacing: "0.08em" }}>SAN JOSE · MARCH 15–19 · INTERVIEW SCHEDULE</p>
        </header>

        {/* SYNC BAR */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap",
          padding: "8px 16px", marginBottom: 14, borderRadius: 8,
          background: syncPulse ? "rgba(118,185,0,0.04)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${syncPulse ? "rgba(118,185,0,0.3)" : "rgba(255,255,255,0.05)"}`,
          fontFamily: "var(--mono)", fontSize: 10, color: "#555", transition: "all 0.3s",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: saving ? "var(--amber)" : "var(--green)", boxShadow: saving ? "none" : "0 0 6px rgba(118,185,0,0.5)", transition: "background 0.3s" }} />
          <span>{saving ? "SAVING..." : "LIVE — SHARED WITH TEAM"}</span>
          {lastTime && <span>· Last edit: {lastTime}{schedule.updatedBy ? ` by ${schedule.updatedBy}` : ""}</span>}
          {userName && <span style={{ color: "var(--green)" }}>· Editing as {userName}</span>}
          {!userName && <span style={{ color: "var(--amber)", cursor: "pointer" }} onClick={() => setShowNameModal(true)}>· Click to set your name</span>}
        </div>

        {/* LEGEND */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#555", boxShadow: "0 0 0 2.5px #888" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#aaa", letterSpacing: "0.06em" }}>HOSTING</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#555", boxShadow: "0 0 0 2.5px var(--red)" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#fca5a5", letterSpacing: "0.06em" }}>INTERVIEWED</span>
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "#444", alignSelf: "center" }}>CLICK CIRCLE TO TOGGLE</span>
        </div>

        {/* TIER FILTERS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 12 }}>
          {Object.entries(TIERS).map(([t, info]) => {
            const active = tierFilter === Number(t);
            return (
              <button key={t} onClick={() => setTierFilter(active ? null : Number(t))}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 7, background: active ? info.bg : "rgba(255,255,255,0.02)", border: `1px solid ${active ? info.border : "rgba(255,255,255,0.06)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, boxShadow: `0 0 5px ${info.color}40` }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", color: active ? info.color : "#777" }}>T{t} · {info.label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* ROSTER */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 18, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ width: "100%", textAlign: "center", marginBottom: 6, fontFamily: "var(--mono)", fontSize: 9, color: "#444", letterSpacing: "0.1em" }}>
            ↕ DRAG INTO SCHEDULE · {total} SLOT{total !== 1 ? "S" : ""} ASSIGNED
          </div>
          {TEAM.filter((p) => { if (!tierFilter) return true; const t = Array.isArray(p.tier) ? p.tier : [p.tier]; return t.includes(tierFilter); }).map((p) => (
            <RosterBadge key={p.id} person={p} count={counts[p.id] || 0} onDragStart={() => {}} />
          ))}
        </div>

        {/* GRID */}
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "64px repeat(5, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ padding: "10px 6px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(118,185,0,0.03)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76B900" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
            </div>
            {DAYS.map((d) => (
              <div key={d.key} style={{ padding: "10px 6px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)", background: d.sub ? "rgba(118,185,0,0.05)" : "transparent" }}>
                <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", color: d.sub ? "var(--green)" : "#bbb" }}>{d.full}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "#555", letterSpacing: "0.06em" }}>{d.date}</div>
                {d.sub && <div style={{ marginTop: 3, fontSize: 7, fontFamily: "var(--mono)", color: "var(--green)", letterSpacing: "0.12em", fontWeight: 700, padding: "1px 6px", background: "rgba(118,185,0,0.1)", borderRadius: 3, display: "inline-block" }}>{d.sub}</div>}
              </div>
            ))}
          </div>

          {HOURS.map((hour, ri) => (
            <div key={hour} style={{ display: "grid", gridTemplateColumns: "64px repeat(5, 1fr)", borderBottom: ri < HOURS.length - 1 ? "1px solid rgba(255,255,255,0.035)" : "none", minHeight: 68 }}>
              <div style={{ padding: "4px 8px 4px 4px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", borderRight: "1px solid rgba(255,255,255,0.06)", background: hour === 12 ? "rgba(118,185,0,0.02)" : undefined }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, color: hour === 12 ? "var(--green)" : "#4a4a4a" }}>{fmtH(hour)}</span>
              </div>
              {DAYS.map((day) => {
                const ck = `${day.key}-${hour}`;
                const cd = schedule.cells[ck] || [];
                const isOver = dragOver === ck;
                return (
                  <div key={ck}
                    onDrop={(e) => handleDrop(ck, e)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(ck); }}
                    onDragLeave={() => setDragOver(null)}
                    style={{
                      borderLeft: "1px solid rgba(255,255,255,0.035)", padding: 4,
                      background: isOver ? "rgba(118,185,0,0.08)" : (hour === 12 ? "rgba(255,255,255,0.006)" : undefined),
                      transition: "background 0.12s ease", position: "relative", minHeight: 68,
                      display: "flex", flexDirection: "column", gap: 3,
                    }}>
                    <div style={{ position: "absolute", left: 6, right: 6, top: "50%", height: 1, background: "rgba(255,255,255,0.018)", pointerEvents: "none" }} />
                    {isOver && cd.length === 0 && (
                      <div style={{ position: "absolute", inset: 4, border: "2px dashed rgba(118,185,0,0.3)", borderRadius: 8, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--green)", opacity: 0.6 }}>DROP HERE</span>
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, position: "relative", zIndex: 1 }}>
                      {cd.map((entry) => {
                        const person = TEAM.find((x) => x.id === entry.id);
                        if (!person) return null;
                        return <CellBadge key={entry.id} person={person} role={entry.role} cellKey={ck} onToggle={() => toggleRole(ck, entry.id)} onRemove={() => removeFromCell(ck, entry.id)} />;
                      })}
                    </div>
                    <NoteEditor value={schedule.notes[ck] || ""} onChange={(v) => setNote(ck, v)} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* EVENTS */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {KEY_EVENTS.map((evt, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: `${evt.color}08`, border: `1px solid ${evt.color}20`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{evt.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: evt.color }}>{evt.time}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 600, color: "#ddd" }}>{evt.event}</div>
              </div>
            </div>
          ))}
        </div>

        {/* STATS */}
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {TEAM.map((p) => {
            const c = counts[p.id] || 0; const col = tierColor(p);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, opacity: c > 0 ? 1 : 0.3 }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: c > 0 ? "#aaa" : "#444" }}>{p.name.split(" ")[0]}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: c > 0 ? col : "#333" }}>{c}</span>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <footer style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "#333", letterSpacing: "0.08em" }}>DRAG TO ASSIGN · CLICK CIRCLE TO TOGGLE · HOVER × TO REMOVE · ADD NOTES PER SLOT</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "#333", letterSpacing: "0.08em" }}>SEMIANALYSIS × SAIL · NVIDIA GTC 2026</span>
            <div style={{ display: "flex", gap: 3 }}>
              {["var(--green)", "var(--blue)", "var(--amber)"].map((c, i) => (
                <div key={i} style={{ width: 12, height: 2.5, borderRadius: 1, background: c }} />
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
