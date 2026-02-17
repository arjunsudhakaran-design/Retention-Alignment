import { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────────
   THE RETENTION COST ICEBERG™
   A framework by [Your Name]
   ───────────────────────────────────────────── */

const ICEBERG_LAYERS = [
  {
    id: "replacement",
    label: "Direct Replacement Cost",
    desc: "Recruiting fees, job ads, signing bonuses, onboarding admin",
    source: "SHRM: 6–9 months of salary. Gallup: 50–200% depending on seniority.",
    above: true,
    defaultMultiplier: 0.5,
    color: "#94B4C1",
    icon: "▲",
  },
  {
    id: "productivity",
    label: "Productivity Void",
    desc: "New hires take 16–20 weeks to reach full productivity — operating at ~25% for the first month, ~50% through week 12.",
    source: "HR Morning; Gallup. New hire ramp at 25%→50%→75% output over 16–20 weeks.",
    above: false,
    defaultMultiplier: 0.75,
    color: "#5B8A9A",
    icon: "◆",
  },
  {
    id: "knowledge",
    label: "Institutional Knowledge Drain",
    desc: "Undocumented processes, client history, tribal knowledge. ~70% of organizations report losing data or IP when employees leave.",
    source: "Perceptyx. Josh Bersin: employees are 'appreciating assets' — value compounds with tenure.",
    above: false,
    defaultMultiplier: 0.5,
    color: "#3D7A8A",
    icon: "◈",
  },
  {
    id: "morale",
    label: "Team Morale Contagion",
    desc: "Turnover is literally contagious. Teammates are 9.1% more likely to resign after a peer departure — spiking to 25% on teams of two.",
    source: "Felps et al., 2009 (Academy of Management Journal). Visier, 2022 research. Gallup: disengaged employees cost 18% of salary.",
    above: false,
    defaultMultiplier: 0.4,
    color: "#2A6270",
    icon: "◇",
  },
  {
    id: "client",
    label: "Client & Revenue Erosion",
    desc: "Relationship discontinuity, service quality dips during transition, competitor poaching risk on key accounts.",
    source: "Industry-dependent. Highest in financial services, consulting, and relationship-driven roles.",
    above: false,
    defaultMultiplier: 0.35,
    color: "#1B4D5A",
    icon: "○",
  },
  {
    id: "manager",
    label: "Manager Time Tax",
    desc: "~50 hours of management time per turnover event: interviewing, re-onboarding, performance restart, emotional labor.",
    source: "Employment Policy Foundation. At manager salary rates plus opportunity cost of diverted strategic time.",
    above: false,
    defaultMultiplier: 0.3,
    color: "#0F3842",
    icon: "□",
  },
  {
    id: "culture",
    label: "Culture Debt",
    desc: "Diluted values through rapid re-hiring, broken team dynamics, loss of high-performance norms, employer brand damage.",
    source: "Edie Goldberg via SHRM: 60–70% of turnover cost is hidden/indirect. Culture debt is the least quantified layer.",
    above: false,
    defaultMultiplier: 0.2,
    color: "#092830",
    icon: "△",
  },
];

const SEVERITY_LABELS = [
  { val: 1, label: "Minimal" },
  { val: 2, label: "Low" },
  { val: 3, label: "Moderate" },
  { val: 4, label: "Significant" },
  { val: 5, label: "Severe" },
];

function formatCurrency(num) {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = value;
    const duration = 800;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return (
    <span>
      {prefix}
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
      {suffix}
    </span>
  );
}

function IcebergViz({ layers, scores, baselineCost }) {
  const aboveLayer = layers.filter((l) => l.above)[0];
  const belowLayers = layers.filter((l) => !l.above);
  const aboveCost = baselineCost * (aboveLayer?.defaultMultiplier || 0.5) * (scores[aboveLayer?.id] || 3) / 3;
  const belowTotal = belowLayers.reduce((sum, l) => {
    const severity = scores[l.id] || 3;
    return sum + baselineCost * l.defaultMultiplier * (severity / 3);
  }, 0);
  const totalCost = aboveCost + belowTotal;
  const maxBarWidth = 280;

  return (
    <div style={{ position: "relative", padding: "20px 0" }}>
      {/* Waterline label */}
      <div style={{ position: "relative", margin: "0 0 0 0" }}>
        {/* Above water */}
        <div style={{ paddingBottom: 16, marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
            <div
              style={{
                width: Math.max(40, (aboveCost / totalCost) * maxBarWidth),
                height: 48,
                background: "linear-gradient(180deg, #B8D4DC 0%, #94B4C1 100%)",
                borderRadius: "8px 8px 2px 2px",
                transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 12px rgba(148,180,193,0.3)",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0A1A20", letterSpacing: "0.02em" }}>
                {formatCurrency(aboveCost)}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "rgba(148,180,193,0.7)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            What you budget for
          </div>
        </div>

        {/* Waterline */}
        <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center", margin: "0 -20px" }}>
          <div style={{ flex: 1, height: 1, background: "repeating-linear-gradient(90deg, rgba(148,180,193,0.4) 0px, rgba(148,180,193,0.4) 8px, transparent 8px, transparent 16px)" }} />
          <span style={{ padding: "0 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(148,180,193,0.5)", whiteSpace: "nowrap" }}>
            ● ● ● waterline ● ● ●
          </span>
          <div style={{ flex: 1, height: 1, background: "repeating-linear-gradient(90deg, rgba(148,180,193,0.4) 0px, rgba(148,180,193,0.4) 8px, transparent 8px, transparent 16px)" }} />
        </div>

        {/* Below water */}
        <div style={{ paddingTop: 8 }}>
          {belowLayers.map((layer, i) => {
            const severity = scores[layer.id] || 3;
            const cost = baselineCost * layer.defaultMultiplier * (severity / 3);
            const barWidth = Math.max(30, (cost / totalCost) * maxBarWidth);
            return (
              <div key={layer.id} style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 6 }}>
                <div
                  style={{
                    width: barWidth,
                    height: 32,
                    background: `linear-gradient(180deg, ${layer.color} 0%, ${layer.color}CC 100%)`,
                    borderRadius: i === belowLayers.length - 1 ? "2px 2px 8px 8px" : 2,
                    transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 2px 8px ${layer.color}33`,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.02em" }}>
                    {formatCurrency(cost)}
                  </span>
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(224,122,95,0.8)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            What's actually costing you
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RetentionCostIceberg() {
  const [step, setStep] = useState(0); // 0=intro, 1=inputs, 2=scoring, 3=results
  const [orgData, setOrgData] = useState({ teamSize: "", avgSalary: "", turnoverRate: "" });
  const [scores, setScores] = useState({});
  const [currentLayer, setCurrentLayer] = useState(0);
  const [fadeState, setFadeState] = useState("in");

  const transition = (nextStep) => {
    setFadeState("out");
    setTimeout(() => {
      setStep(nextStep);
      setFadeState("in");
    }, 300);
  };

  const baselineCost = (() => {
    const salary = parseFloat(orgData.avgSalary) || 85000;
    return salary;
  })();

  const totalHiddenCost = (() => {
    return ICEBERG_LAYERS.reduce((sum, layer) => {
      const severity = scores[layer.id] || 3;
      return sum + baselineCost * layer.defaultMultiplier * (severity / 3);
    }, 0);
  })();

  const visibleCost = baselineCost * 0.5 * ((scores["replacement"] || 3) / 3);
  const multiplier = visibleCost > 0 ? totalHiddenCost / visibleCost : 0;
  const annualExposure = (() => {
    const teamSize = parseInt(orgData.teamSize) || 50;
    const turnoverRate = (parseFloat(orgData.turnoverRate) || 15) / 100;
    return totalHiddenCost * teamSize * turnoverRate;
  })();

  const canProceedFromInputs = orgData.teamSize && orgData.avgSalary && orgData.turnoverRate;

  const renderIntro = () => (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ marginBottom: 40, opacity: 0.15, fontSize: 80, lineHeight: 1 }}>▽</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94B4C1", marginBottom: 20 }}>
        A Framework for People Leaders
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(36px, 6vw, 52px)", fontWeight: 700, lineHeight: 1.1, margin: "0 0 16px", maxWidth: 560, color: "#E8E4D9" }}>
        The Retention<br />Cost Iceberg
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(232,228,217,0.5)", maxWidth: 480, margin: "0 0 40px", fontFamily: "'Source Serif 4', Georgia, serif" }}>
        You're budgeting for replacement cost.<br />
        Your actual exposure is 3–5× higher.<br />
        <span style={{ color: "rgba(224,122,95,0.9)" }}>Here's the math.</span>
      </p>
      <button
        onClick={() => transition(1)}
        style={{
          padding: "16px 40px",
          background: "transparent",
          border: "1px solid rgba(148,180,193,0.3)",
          color: "#94B4C1",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "inherit",
          borderRadius: 4,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { e.target.style.background = "rgba(148,180,193,0.08)"; e.target.style.borderColor = "rgba(148,180,193,0.5)"; }}
        onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(148,180,193,0.3)"; }}
      >
        Score Your Organization →
      </button>
      <div style={{ marginTop: 60, fontSize: 10, color: "rgba(232,228,217,0.2)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        Scroll or click to begin
      </div>
    </div>
  );

  const renderInputs = () => (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94B4C1", marginBottom: 12 }}>
        Step 1 of 2
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: "#E8E4D9" }}>
        Your Organization
      </h2>
      <p style={{ fontSize: 14, color: "rgba(232,228,217,0.4)", margin: "0 0 36px", lineHeight: 1.6 }}>
        Three data points to calculate your true retention exposure.
      </p>

      {[
        { key: "teamSize", label: "Team / Department Size", placeholder: "e.g. 50", unit: "people", hint: "The team or org unit you're analyzing" },
        { key: "avgSalary", label: "Average Annual Salary", placeholder: "e.g. 85000", unit: "CAD", hint: "Blended average across the team" },
        { key: "turnoverRate", label: "Annual Turnover Rate", placeholder: "e.g. 15", unit: "%", hint: "Voluntary turnover in the last 12 months" },
      ].map((field) => (
        <div key={field.key} style={{ marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(232,228,217,0.7)", marginBottom: 8 }}>
            {field.label}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="number"
              placeholder={field.placeholder}
              value={orgData[field.key]}
              onChange={(e) => setOrgData((prev) => ({ ...prev, [field.key]: e.target.value }))}
              style={{
                flex: 1,
                background: "rgba(232,228,217,0.04)",
                border: "1px solid rgba(232,228,217,0.1)",
                borderRadius: 6,
                padding: "14px 16px",
                color: "#E8E4D9",
                fontSize: 18,
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontWeight: 500,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(148,180,193,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(232,228,217,0.1)")}
            />
            <span style={{ fontSize: 12, color: "rgba(232,228,217,0.3)", fontWeight: 600, letterSpacing: "0.06em", minWidth: 40 }}>
              {field.unit}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(232,228,217,0.25)", marginTop: 6 }}>{field.hint}</div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
        <button
          onClick={() => transition(0)}
          style={{ padding: "14px 24px", background: "none", border: "1px solid rgba(232,228,217,0.1)", color: "rgba(232,228,217,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 4, letterSpacing: "0.04em" }}
        >
          ← Back
        </button>
        <button
          onClick={() => { setCurrentLayer(0); transition(2); }}
          disabled={!canProceedFromInputs}
          style={{
            flex: 1,
            padding: "14px 24px",
            background: canProceedFromInputs ? "linear-gradient(135deg, #1B4D5A, #2A6270)" : "rgba(232,228,217,0.05)",
            border: "none",
            color: canProceedFromInputs ? "#E8E4D9" : "rgba(232,228,217,0.2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: canProceedFromInputs ? "pointer" : "default",
            fontFamily: "inherit",
            borderRadius: 4,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            transition: "all 0.2s ease",
          }}
        >
          Score the Hidden Layers →
        </button>
      </div>
    </div>
  );

  const renderScoring = () => {
    const layer = ICEBERG_LAYERS[currentLayer];
    const isLast = currentLayer === ICEBERG_LAYERS.length - 1;
    const progress = ((currentLayer + 1) / ICEBERG_LAYERS.length) * 100;

    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        {/* Progress */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94B4C1" }}>
              Step 2 of 2 — Layer {currentLayer + 1} of {ICEBERG_LAYERS.length}
            </span>
            <span style={{ fontSize: 10, color: "rgba(232,228,217,0.3)", fontWeight: 600 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(232,228,217,0.06)", borderRadius: 2 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #1B4D5A, #94B4C1)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Layer card */}
        <div
          style={{
            background: `linear-gradient(135deg, ${layer.color}15, transparent)`,
            border: `1px solid ${layer.color}30`,
            borderRadius: 16,
            padding: 32,
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            {layer.above ? (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94B4C1", background: "rgba(148,180,193,0.1)", padding: "3px 8px", borderRadius: 3 }}>
                Above the waterline
              </span>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E07A5F", background: "rgba(224,122,95,0.1)", padding: "3px 8px", borderRadius: 3 }}>
                Hidden cost layer
              </span>
            )}
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, margin: "12px 0 10px", color: "#E8E4D9" }}>
            {layer.icon} {layer.label}
          </h3>
          <p style={{ fontSize: 14, color: "rgba(232,228,217,0.5)", lineHeight: 1.7, margin: 0 }}>
            {layer.desc}
          </p>
          {layer.source && (
            <p style={{ fontSize: 11, color: "rgba(148,180,193,0.5)", lineHeight: 1.5, margin: "10px 0 0", fontStyle: "italic", borderTop: "1px solid rgba(232,228,217,0.06)", paddingTop: 10 }}>
              📎 {layer.source}
            </p>
          )}
        </div>

        {/* Severity scoring */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(232,228,217,0.6)", marginBottom: 16, letterSpacing: "0.04em" }}>
            How severely does this affect your organization?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {SEVERITY_LABELS.map((s) => {
              const selected = scores[layer.id] === s.val;
              return (
                <button
                  key={s.val}
                  onClick={() => setScores((prev) => ({ ...prev, [layer.id]: s.val }))}
                  style={{
                    flex: 1,
                    padding: "14px 4px",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: selected ? layer.color : "rgba(232,228,217,0.08)",
                    background: selected ? `${layer.color}20` : "rgba(232,228,217,0.02)",
                    color: selected ? "#E8E4D9" : "rgba(232,228,217,0.35)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.val}
                  </span>
                  <span style={{ fontSize: 9, letterSpacing: "0.04em" }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cost preview */}
        {scores[layer.id] && (
          <div style={{ background: "rgba(232,228,217,0.03)", borderRadius: 10, padding: 16, marginBottom: 28, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "rgba(232,228,217,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              Estimated cost per departure
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: layer.above ? "#94B4C1" : "#E07A5F" }}>
              {formatCurrency(baselineCost * layer.defaultMultiplier * (scores[layer.id] / 3))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              if (currentLayer > 0) setCurrentLayer(currentLayer - 1);
              else transition(1);
            }}
            style={{ padding: "14px 24px", background: "none", border: "1px solid rgba(232,228,217,0.1)", color: "rgba(232,228,217,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 4, letterSpacing: "0.04em" }}
          >
            ←
          </button>
          <button
            onClick={() => {
              if (!scores[layer.id]) setScores((prev) => ({ ...prev, [layer.id]: 3 }));
              if (isLast) transition(3);
              else setCurrentLayer(currentLayer + 1);
            }}
            style={{
              flex: 1,
              padding: "14px 24px",
              background: scores[layer.id] ? "linear-gradient(135deg, #1B4D5A, #2A6270)" : "rgba(232,228,217,0.05)",
              border: "none",
              color: "#E8E4D9",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              borderRadius: 4,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
            }}
          >
            {isLast ? "Reveal Your Iceberg →" : "Next Layer →"}
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const teamSize = parseInt(orgData.teamSize) || 50;
    const turnoverRate = parseFloat(orgData.turnoverRate) || 15;
    const departures = Math.round(teamSize * (turnoverRate / 100));

    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Header reveal */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#E07A5F", marginBottom: 12 }}>
            Your Retention Cost Iceberg
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, margin: "0 0 8px", color: "#E8E4D9", lineHeight: 1.2 }}>
            You're seeing{" "}
            <span style={{ color: "#94B4C1" }}>{formatCurrency(visibleCost)}</span>
          </h2>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, margin: "0 0 20px", color: "#E8E4D9", lineHeight: 1.2 }}>
            You're losing{" "}
            <span style={{ color: "#E07A5F" }}>{formatCurrency(totalHiddenCost)}</span>
          </h2>
          <div style={{ fontSize: 14, color: "rgba(232,228,217,0.45)", lineHeight: 1.6 }}>
            Per departure · Based on your severity scores
          </div>
        </div>

        {/* Multiplier callout */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(224,122,95,0.08), rgba(224,122,95,0.02))",
            border: "1px solid rgba(224,122,95,0.15)",
            borderRadius: 16,
            padding: 28,
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(224,122,95,0.7)", fontWeight: 700, marginBottom: 8 }}>
            Your True Cost Multiplier
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 56, fontWeight: 700, color: "#E07A5F", lineHeight: 1 }}>
            <AnimatedCounter value={multiplier} suffix="×" decimals={1} />
          </div>
          <div style={{ fontSize: 13, color: "rgba(232,228,217,0.4)", marginTop: 10, lineHeight: 1.6 }}>
            For every $1 you budget for replacement, you're actually losing ${multiplier.toFixed(2)} in total organizational cost.
          </div>
        </div>

        {/* Iceberg visualization */}
        <div
          style={{
            background: "rgba(232,228,217,0.02)",
            border: "1px solid rgba(232,228,217,0.06)",
            borderRadius: 16,
            padding: "24px 20px",
            marginBottom: 36,
          }}
        >
          <IcebergViz layers={ICEBERG_LAYERS} scores={scores} baselineCost={baselineCost} />
        </div>

        {/* Annual exposure */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(27,77,90,0.2), rgba(15,56,66,0.2))",
            border: "1px solid rgba(148,180,193,0.15)",
            borderRadius: 16,
            padding: 28,
            marginBottom: 36,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,180,193,0.6)", fontWeight: 700, marginBottom: 6 }}>
                Annual Exposure
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: "#E8E4D9" }}>
                <AnimatedCounter value={annualExposure} prefix="$" />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "rgba(232,228,217,0.4)", lineHeight: 1.6 }}>
                {teamSize} people × {turnoverRate}% turnover
              </div>
              <div style={{ fontSize: 12, color: "rgba(232,228,217,0.4)", lineHeight: 1.6 }}>
                = ~{departures} departures/year
              </div>
              <div style={{ fontSize: 12, color: "rgba(232,228,217,0.4)", lineHeight: 1.6 }}>
                × {formatCurrency(totalHiddenCost)} true cost each
              </div>
            </div>
          </div>
        </div>

        {/* Layer breakdown */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(232,228,217,0.3)", marginBottom: 16 }}>
            Layer Breakdown
          </div>
          {ICEBERG_LAYERS.map((layer) => {
            const severity = scores[layer.id] || 3;
            const cost = baselineCost * layer.defaultMultiplier * (severity / 3);
            const pct = totalHiddenCost > 0 ? (cost / totalHiddenCost) * 100 : 0;
            return (
              <div
                key={layer.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(232,228,217,0.04)",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: layer.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(232,228,217,0.8)" }}>
                    {layer.label}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(232,228,217,0.3)" }}>
                    Severity: {severity}/5 · {pct.toFixed(0)}% of total
                  </div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: layer.above ? "#94B4C1" : "#E07A5F", flexShrink: 0 }}>
                  {formatCurrency(cost)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight callout */}
        <div
          style={{
            background: "rgba(232,228,217,0.03)",
            borderLeft: "3px solid #E07A5F",
            borderRadius: "0 12px 12px 0",
            padding: "20px 24px",
            marginBottom: 36,
          }}
        >
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, color: "#E8E4D9", lineHeight: 1.6, marginBottom: 8 }}>
            The Strategic Takeaway
          </div>
          <div style={{ fontSize: 13, color: "rgba(232,228,217,0.5)", lineHeight: 1.7 }}>
            {multiplier >= 4
              ? `At a ${multiplier.toFixed(1)}× multiplier, every percentage point reduction in turnover saves your organization approximately ${formatCurrency(annualExposure * 0.01 / (turnoverRate / 100))}. The business case for retention investment isn't just an HR argument — it's a P&L argument.`
              : multiplier >= 2.5
              ? `Your ${multiplier.toFixed(1)}× multiplier reveals significant hidden costs below the waterline. Focus on your highest-severity layers first — even a 1-point severity reduction in your top cost driver would save ${formatCurrency(baselineCost * 0.25 * departures)} annually.`
              : `Your ${multiplier.toFixed(1)}× multiplier suggests your visible and hidden costs are relatively balanced. Maintain focus on preventing hidden layers from deepening, especially in morale contagion and knowledge drain.`}
          </div>
        </div>

        {/* Restart */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => transition(2)}
            style={{ padding: "14px 24px", background: "none", border: "1px solid rgba(232,228,217,0.1)", color: "rgba(232,228,217,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 4, letterSpacing: "0.04em" }}
          >
            ← Adjust Scores
          </button>
          <button
            onClick={() => { setScores({}); setOrgData({ teamSize: "", avgSalary: "", turnoverRate: "" }); transition(0); }}
            style={{ flex: 1, padding: "14px 24px", background: "linear-gradient(135deg, #1B4D5A, #2A6270)", border: "none", color: "#E8E4D9", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            Start Over
          </button>
        </div>

        {/* Methodology */}
        <div
          style={{
            background: "rgba(232,228,217,0.02)",
            border: "1px solid rgba(232,228,217,0.06)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 36,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(232,228,217,0.3)", marginBottom: 12 }}>
            Methodology & Sources
          </div>
          <div style={{ fontSize: 12, color: "rgba(232,228,217,0.4)", lineHeight: 1.8 }}>
            <div style={{ marginBottom: 8 }}>Layer multipliers are derived from published research by <strong style={{ color: "rgba(232,228,217,0.55)" }}>SHRM</strong> (6–9 months salary replacement cost), <strong style={{ color: "rgba(232,228,217,0.55)" }}>Gallup</strong> (50–200% of salary by seniority), and <strong style={{ color: "rgba(232,228,217,0.55)" }}>Josh Bersin / Deloitte</strong> (1.5–2× total cost). Hidden cost proportion from <strong style={{ color: "rgba(232,228,217,0.55)" }}>Edie Goldberg via SHRM</strong> (60–70% indirect).</div>
            <div style={{ marginBottom: 8 }}>Productivity ramp data from <strong style={{ color: "rgba(232,228,217,0.55)" }}>HR Morning</strong> and <strong style={{ color: "rgba(232,228,217,0.55)" }}>Gallup</strong> (16–20 week ramp, 25%→50%→75% capacity). Manager time tax from <strong style={{ color: "rgba(232,228,217,0.55)" }}>Employment Policy Foundation</strong> (~50 hrs/event).</div>
            <div style={{ marginBottom: 8 }}>Turnover contagion from <strong style={{ color: "rgba(232,228,217,0.55)" }}>Felps et al., 2009</strong> (Academy of Management Journal) and <strong style={{ color: "rgba(232,228,217,0.55)" }}>Visier, 2022</strong> (9.1% increased resignation probability; 25% on teams of two).</div>
            <div>Severity scores are self-assessed. This model is a diagnostic framework, not an audit. Outputs represent estimated exposure ranges to support strategic conversation, not precise financial projections.</div>
          </div>
        </div>

        {/* Attribution */}
        <div style={{ textAlign: "center", marginTop: 60, paddingTop: 24, borderTop: "1px solid rgba(232,228,217,0.06)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(232,228,217,0.15)" }}>
            The Retention Cost Iceberg™ Framework
          </div>
          <div style={{ fontSize: 11, color: "rgba(232,228,217,0.25)", marginTop: 4 }}>
            Built for People Leaders who think in business outcomes.
          </div>
        </div>
      </div>
    );
  };

  const globalCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Serif+4:wght@400;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    ::selection { background: rgba(148,180,193,0.3); }
  `;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A1A20",
        color: "#E8E4D9",
        fontFamily: "'Source Serif 4', Georgia, serif",
      }}
    >
      <style>{globalCSS}</style>
      <div
        style={{
          opacity: fadeState === "in" ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        {step === 0 && renderIntro()}
        {step === 1 && renderInputs()}
        {step === 2 && renderScoring()}
        {step === 3 && renderResults()}
      </div>
    </div>
  );
}
