const { useState, useMemo } = React;

/* --------------------------------- UI Bits --------------------------------- */
function SectionTitle({ children }) {
  return (
    <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#334155",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginTop: 8,
          marginBottom: 4,
        }}
      >
        {children}
      </div>
      <div style={{ height: 1, background: "#e2e8f0", marginBottom: 8 }} />
    </div>
  );
}

/* ----------------------------- GLOBAL CONSTANTS ---------------------------- */
const MAX_ROLLED_MONTHS = 0; // Set to 0 as per new criteria
const MAX_DEFERRED_FIX = 0; // Set to 0 as per new criteria
const MAX_DEFERRED_TRACKER = 0; // Set to 0 as per new criteria
const MIN_STRESS_RATE = window.MIN_STRESS_RATE; // New variable for min stress rate
const SHOW_FEE_COLS = ["6", "4", "3", "2"];

/* ------------------------------ UTIL FUNCTIONS ----------------------------- */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const fmtMoney0 = (n) =>
  n || n === 0
    ? Number(n).toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    })
    : "—";
const fmtPct = (p, dp = 2) =>
  p || p === 0 ? `${(Number(p) * 100).toFixed(dp)}%` : "—";

/* Tier/LTV rule */
function getMaxLTV(tier) {
  return 0.75;
}
function formatRevertRate(tier) {
  const add = window.REVERT_RATE_Prime?.[tier]?.add ?? 0;
  return add === 0 ? "MVR" : `MVR + ${(add * 100).toFixed(2)}%`;
}
function formatERC(productType) {
  const ercArr = window.ERC_Prime?.[productType] ?? ["—"];
  return ercArr.join(" / ");
}

/* ----------------------------------- App ----------------------------------- */
function App() {
  const [productType, setProductType] = useState("2yr Fix");
  const [useSpecificNet, setUseSpecificNet] = useState("No");
  const [specificNetLoan, setSpecificNetLoan] = useState("");

  // Client / Lead
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // Add this line

  // Property & income
  const [propertyValue, setPropertyValue] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");

  // Property drivers
  const [hmo, setHmo] = useState("No");
  const [mufb, setMufb] = useState("No");
  const [holiday, setHoliday] = useState("No");
  const [devExit, setDevExit] = useState("No");

  // Applicant drivers
  const [expat, setExpat] = useState("No");
  const [ftl, setFtl] = useState("No");
  const [ftb, setFtb] = useState("No"); // First time buyer

  // Adverse
  const [adverse, setAdverse] = useState("No");
  const [mortArrears, setMortArrears] = useState("No");
  const [unsArrears, setUnsArrears] = useState("No");
  const [ccjDefault, setCcjDefault] = useState("No");
  const [bankruptcy, setBankruptcy] = useState("Never");

  // Tier
  const tier = useMemo(() => {
    // Check for exclusions first
    if (holiday === "Yes" || ftb === "Yes" || bankruptcy !== "Never" || expat === "Foreign National") {
      return "Excluded";
    }

    const mapHmo = {
      "No": 1,
      "Up to 6 beds": 2,
    };
    const mapMufb = {
      "No": 1,
      "Up to 6 units": 2,
    };
    const mapExp = {
      "No": 1,
      "UK footprint": 2,
    };
    const mapFtl = {
      "No": 1,
      "Yes": 2,
    };
    const mapDevExit = {
      "No": 1,
      "Yes": 2,
    };

    let t = Math.max(
      mapHmo[hmo] || 1,
      mapMufb[mufb] || 1,
      mapExp[expat] || 1,
      mapFtl[ftl] || 1,
      mapDevExit[devExit] || 1
    );

    if (adverse === "Yes") {
      const advMapMA = { "No": 1, "0 in 24": 1, "0 in 18": 2 };
      const advMapUA = { "No": 1, "0 in 24": 1, "0 in 12": 2 };
      const advMapCD = { "No": 1, "0 in 24": 1, "0 in 18": 2 };
      const adverseTier = Math.max(
        advMapMA[mortArrears] || 1,
        advMapUA[unsArrears] || 1,
        advMapCD[ccjDefault] || 1
      );
      t = Math.max(t, adverseTier);
    }

    return t === 1 ? "Tier 1" : "Tier 2";
  }, [
    hmo,
    mufb,
    expat,
    holiday,
    ftl,
    devExit,
    ftb,
    adverse,
    mortArrears,
    unsArrears,
    ccjDefault,
    bankruptcy
  ]);

  const selected = tier !== "Excluded" ? window.RATES_Prime[tier]?.products?.[productType] : null;
  const isTracker = !!selected?.isMargin;

  // External constants
  const MIN_ICR_FIX = window.MIN_ICR_Prime?.Fix ?? 1.25;
  const MIN_ICR_TRK = window.MIN_ICR_Prime?.Tracker ?? 1.30;
  const MIN_LOAN = window.MIN_LOAN_Prime ?? 150000;
  const MAX_LOAN = window.MAX_LOAN_Prime ?? 3000000;
  const STANDARD_BBR = window.STANDARD_BBR_Prime ?? 0.04;
  const STRESS_BBR = window.STRESS_BBR_Prime ?? 0.0425;
  const TERM_MONTHS = window.TERM_MONTHS_Prime ?? {
    "2yr Fix": 24,
    "3yr Fix": 36,
    "2yr Tracker": 24,
    Tracker: 24, // backward-compat
  };
  const TOTAL_TERM = window.TOTAL_TERM_Prime ?? 10; // years
  const LEAD_TO = window.LEAD_TO_Prime ?? "leads@example.com";
  const CURRENT_MVR = window.CURRENT_MVR_Prime;

  /* ------------------------------ Calculations ----------------------------- */
  const canShowMatrix = useMemo(() => {
    if (tier === "Excluded") return false;
    const mr = toNumber(monthlyRent);
    const pv = toNumber(propertyValue);
    const sn = toNumber(specificNetLoan);
    if (!mr) return false;
    if (useSpecificNet === "Yes") return !!sn;
    return !!pv;
  }, [monthlyRent, propertyValue, specificNetLoan, useSpecificNet, tier]);

  // Main per-column calculation (no rolled/deferred)
  function computeForCol(colKey) {
    const feePct = Number(colKey) / 100;
    const base = selected?.[colKey];
    if (base == null) return null;

    const displayRate = isTracker ? base + STANDARD_BBR : base;
    const fullRateText = isTracker
      ? `${(base * 100).toFixed(2)}% + BBR`
      : `${(displayRate * 100).toFixed(2)}%`;

    const payRateAdj = displayRate;
    const payRateText = fullRateText;

    const pv = toNumber(propertyValue);
    const mr = toNumber(monthlyRent);

    const minICR = productType.includes("Fix") ? MIN_ICR_FIX : MIN_ICR_TRK;
    const maxLTV = getMaxLTV(tier);
    const grossLTV = pv ? pv * maxLTV : Infinity;

    const stressRate = Math.max(isTracker ? base + STRESS_BBR : displayRate, MIN_STRESS_RATE);
    const termMonths = TERM_MONTHS_Prime[productType] ?? 24;
    const monthsLeft = termMonths;
    const stressAdj = stressRate;

    let grossRent = Infinity;
    if (mr && stressAdj) {
     const annualRent = mr * termMonths;
      grossRent = annualRent / (minICR * (stressAdj / 12) * monthsLeft);
    }
  
   
    const N_input = toNumber(specificNetLoan);
    let grossFromNet = null;
    if (N_input && useSpecificNet === "Yes") {
      const numerator = N_input;
      const denominator = 1 - feePct;
      grossFromNet = numerator / denominator;
    }

    let eligibleGross = Math.min(grossLTV, grossRent, MAX_LOAN);
    if (useSpecificNet === "Yes" && grossFromNet != null) {
      eligibleGross = Math.min(eligibleGross, grossFromNet);
    }
    const belowMin = eligibleGross < MIN_LOAN - 1e-6;
    const hitMaxCap = Math.abs(eligibleGross - MAX_LOAN) < 1e-6;

    const feeAmt = eligibleGross * feePct;
    const net = eligibleGross - feeAmt;
    const ltv = pv ? eligibleGross / pv : null;
    const ddAmount = eligibleGross * (payRateAdj / 12);

    return {
      productName: `${productType}, ${tier}`,
      fullRateText,
      payRateText,
      net,
      gross: eligibleGross,
      feeAmt,
      ltv,
      directDebit: ddAmount,
      maxLTVRule: maxLTV,
      belowMin,
      hitMaxCap,
    };
  }

  // "Basic Gross" is now the same as the main gross, as there's no deferred/roll
  function computeBasicGrossForCol(colKey) {
    return computeForCol(colKey);
  }

  // Best summary across the four columns (by gross)
  const bestSummary = useMemo(() => {
    if (!canShowMatrix) return null;
    const pv = toNumber(propertyValue) || 0;

    const items = SHOW_FEE_COLS
      .map((k) => [k, computeForCol(k)])
      .filter(([, d]) => !!d);

    if (!items.length) return null;

    let best = null;
    for (const [colKey, d] of items) {
      if (!best || d.gross > best.gross) {
        best = {
          colKey,
          gross: d.gross,
          grossStr: fmtMoney0(d.gross),
          grossLtvPct: pv ? Math.round((d.gross / pv) * 100) : 0,
          net: d.net,
          netStr: fmtMoney0(d.net),
          netLtvPct: pv ? Math.round((d.net / pv) * 100) : 0,
        };
      }
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType, tier, propertyValue, monthlyRent, useSpecificNet, specificNetLoan, canShowMatrix]);

  /* --------------------------- Send Quote via Email --------------------------- */
  const handleSendQuote = async () => {
    if (!canShowMatrix || !bestSummary) {
      alert("Please ensure the calculation is complete before sending.");
      return;
    }

    setSending(true);
    setSendStatus(null);

    try {
      // --- IMPORTANT: Replace with your actual Zapier Webhook URL ---
      const zapierWebhookUrl = "https://hooks.zapier.com/hooks/catch/10082441/utp5b85/";

      const columnCalculations = SHOW_FEE_COLS
        .map((k) => ({ feePercent: k, ...computeForCol(k) }))
        .filter((d) => !!d.gross);

      const payload = {
        requestId: `MFS-PRIME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientName, clientPhone, clientEmail,
        propertyValue, monthlyRent, productType, useSpecificNet, specificNetLoan,
        hmo, mufb, holiday, devExit,
        expat, ftl, ftb,
        adverse, mortArrears, unsArrears, ccjDefault, bankruptcy,
        tier,
        bestSummary,
        allColumnData: columnCalculations,
        submissionTimestamp: new Date().toISOString(),
        revertRate: formatRevertRate(tier),
        totalTerm: `${TOTAL_TERM} years`,
        erc: formatERC(productType),
        currentMvr: CURRENT_MVR,
        standardBbr: STANDARD_BBR,
      };

      let success = false;
      
      // --- 1) TRY JSON POST (Primary Method) ---
      try {
        const res = await fetch(zapierWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) success = true;
      } catch (e) {
        console.warn("JSON POST failed (expected in browser due to CORS):", e);
      }

      // --- 2) FALLBACK: Form-encoded POST ---
      if (!success) {
        try {
          const form = new URLSearchParams();
          for (const [k, v] of Object.entries(payload)) {
            form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));
          }
          const res2 = await fetch(zapierWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: form.toString(),
          });
          if (res2.ok) success = true;
        } catch (e2) {
          console.warn("Form-encoded POST failed:", e2);
        }
      }

      if (success) {
        setSendStatus("success");
      } else {
        setSendStatus("error");
      }
    } catch (error) {
      console.error("An unexpected error occurred in handleSendQuote:", error);
      setSendStatus("error");
    } finally {
      setSending(false);
    }
  };

  /* --------------------------- Inline value styles -------------------------- */
  const valueBoxStyle = {
    width: "100%",
    textAlign: "center",
    fontWeight: 400,                 // values NOT bold
    background: "#e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
  };

  return (
    <div className="container">
      {/* --------------------- Property Details (full width) -------------------- */}
      <div className="card" style={{ gridColumn: "1 / -1", position: "relative" }}>
        
        {/* New flexbox container for header elements */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          
          {/* Left side: Heading */}
          <div>
            <h3>MFS BTL Residential Calculator (Core Product)</h3>
          </div>

          {/* Right side: Links and Exclusions */}
          <div className="top-right-container">
            <div className="top-right-links">
              <a href="https://example.com/btl-prime-criteria" target="_blank" rel="noopener noreferrer">BTL Residential Criteria</a>
              <a href="https://example.com/btl-prime-product-guide" target="_blank" rel="noopener noreferrer">BTL Product Guide</a>
            </div>
            <div className="top-right-exclusions">
              EXCLUSIONS
              <div className="exclusion-list">
                <ul style={{ margin: 0, padding: '0 0 0 16px', listStyleType: 'disc'}}>
                  <li>Holiday Let</li>
                  <li>First Time Buyer</li>
                  <li>Offshore Company</li>
                </ul>
                <ul style={{ margin: 0, padding: '0 0 0 16px', listStyleType: 'disc'}}>
                  <li>Foreign National</li>
                  <li>Bankruptcy</li>
                  <li>Flat above commercial</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* This is the section you want to move */}
        <div className="note" style={{ marginBottom: 8, marginTop: '20px' }}>
          Tier is calculated automatically from the inputs below. Current:{" "}
          <b>{tier}</b>
        </div>

        {tier === "Excluded" && (
          <div style={{
            gridColumn: "1 / -1",
            margin: "8px 0 12px 0",
            padding: "10px 12px",
            borderRadius: 10,
            background: "#ffebee",
            border: "1px solid #f44336",
            color: "#d32f2f",
            fontWeight: 600,
            textAlign: "center",
          }}>
            This product is not available for the selected criteria.
          </div>
        )}

        <div className="profile-grid">
          <SectionTitle>Property Type</SectionTitle>

          <div className="field">
            <label>HMO</label>
            <select value={hmo} onChange={(e) => setHmo(e.target.value)}>
              <option>No</option>
              <option>Up to 6 beds</option>
            </select>
          </div>

          <div className="field">
            <label>MUFB</label>
            <select value={mufb} onChange={(e) => setMufb(e.target.value)}>
              <option>No</option>
              <option>Up to 6 units</option>
            </select>
          </div>
          
          <div className="field">
            <label>Holiday Let?</label>
            <select value={holiday} onChange={(e) => setHoliday(e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <div className="field">
            <label>Dev Exit?</label>
            <select value={devExit} onChange={(e) => setDevExit(e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <SectionTitle>Applicant Details</SectionTitle>

          <div className="field">
            <label>Expat / Foreign National</label>
            <select value={expat} onChange={(e) => setExpat(e.target.value)}>
              <option>No</option>
              <option>UK footprint</option>
              <option>Foreign National</option>
            </select>
          </div>

          <div className="field">
            <label>First Time Buyer?</label>
            <select value={ftb} onChange={(e) => setFtb(e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <div className="field">
            <label>First Time Landlord?</label>
            <select value={ftl} onChange={(e) => setFtl(e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>
          
          <div className="field">
            <label>Adverse Credit?</label>
            <select value={adverse} onChange={(e) => setAdverse(e.target.value)}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          {adverse === "Yes" && (
            <>
              <div className="field">
                <label>Mortgage Arrears</label>
                <select value={mortArrears} onChange={(e) => setMortArrears(e.target.value)}>
                  <option>No</option>
                  <option>0 in 24</option>
                  <option>0 in 18</option>
                </select>
              </div>

              <div className="field">
                <label>Unsecured Arrears</label>
                <select value={unsArrears} onChange={(e) => setUnsArrears(e.target.value)}>
                  <option>No</option>
                  <option>0 in 24</option>
                  <option>0 in 12</option>
                </select>
              </div>

              <div className="field">
                <label>CCJ & Defaults</label>
                <select value={ccjDefault} onChange={(e) => setCcjDefault(e.target.value)}>
                  <option>No</option>
                  <option>0 in 24</option>
                  <option>0 in 18</option>
                </select>
              </div>
              
              <div className="field">
                <label>Bankruptcy</label>
                <select value={bankruptcy} onChange={(e) => setBankruptcy(e.target.value)}>
                  <option>Never</option>
                  <option>Anytime</option>
                  </select>
              </div>
            </>
          )}

          <SectionTitle>Property & Product</SectionTitle>

          <div className="profile-grid property-product" style={{ gridColumn: "1 / -1" }}>
            <div className="field">
              <label>Property Value (£)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 350000"
                value={propertyValue}
                onChange={(e) => setPropertyValue(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Monthly Rent (£)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 1600"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Use Specific Net Loan?</label>
              <select value={useSpecificNet} onChange={(e) => setUseSpecificNet(e.target.value)}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>

            {useSpecificNet === "Yes" && (
              <div className="field">
                <label>Specific Net Loan (£)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 200000"
                  value={specificNetLoan}
                  onChange={(e) => setSpecificNetLoan(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label>Product Type</label>
              <select value={productType} onChange={(e) => setProductType(e.target.value)}>
                {window.PRODUCT_TYPES_Prime.filter(p => p !== "5yr Fix" && p !== "Non-Prime").map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------- Client Details & Lead (full) --------------------- */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>Email This Quote</h3>
        <div className="profile-grid">
          <div className="field">
            <label>Client Name</label>
            <input
              type="text"
              placeholder="e.g. John Smith"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Contact Number</label>
            <input
              type="tel"
              placeholder="e.g. 07123 456789"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. john@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>

          <div className="field" style={{ alignSelf: "end" }}>
            <button 
              onClick={handleSendQuote} 
              className="primaryBtn" 
              disabled={sending || !canShowMatrix}
            >
              {sending ? "Sending…" : "Send Quote via Email"}
            </button>
            <div className="note"></div>
          </div>
        </div>
        {sendStatus === "success" && (
          <div style={{ marginTop: "16px", padding: "16px", background: "#f0fdf4", border: "1px solid #4ade80", color: "#166534", borderRadius: "8px" }}>
            Email sent successfully!
          </div>
        )}
        {sendStatus === "error" && (
          <div style={{ marginTop: "16px", padding: "16px", background: "#fff1f2", border: "1px solid #f87171", color: "#b91c1c", borderRadius: "8px" }}>
            Failed to send email. Please try again later.
          </div>
        )}
      </div>

      {/* ===== Maximum Loan Summary (below Client Details) ===== */}
      {canShowMatrix && bestSummary && (
        <div
          className="card"
          style={{
            gridColumn: "1 / -1",
            background: "#8a1746",
            color: "#fff",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              textAlign: "center",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            Based on the inputs, the maximum gross loan is:
          </div>

          <div style={{ padding: "12px 16px" }}>
            <div
              style={{
                background: "#ffffff",
                color: "#111827",
                borderRadius: 8,
                padding: "14px 16px",
                fontSize: 22,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {bestSummary.grossStr} @ {bestSummary.grossLtvPct}% LTV, {productType},{" "}
              {tier}, {Number(bestSummary.colKey)}% Fee
            </div>

            <div
              style={{
                marginTop: 8,
                background: "#791640",
                color: "#ffffff",
                borderRadius: 8,
                padding: "8px 12px",
                textAlign: "center",
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 800, textDecoration: "underline" }}>
                Max net loan
              </span>{" "}
              <span style={{ opacity: 0.95 }}>
                (amount advanced day 1) is {bestSummary.netStr} @{" "}
                {bestSummary.netLtvPct}% LTV, {productType}, {tier},{" "}
                {Number(bestSummary.colKey)}% Fee
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------- OUTPUT MATRIX (labels + 4 cols) ---------------- */}
      {canShowMatrix && (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="matrix">
            {(() => {
              const colData = SHOW_FEE_COLS.map((k) => [k, computeForCol(k)]).filter(([, d]) => !!d);
              const anyBelowMin = colData.some(([, d]) => d.belowMin);
              const anyAtMaxCap = colData.some(([, d]) => d.hitMaxCap);

              return (
                <>
                  {(anyBelowMin || anyAtMaxCap) && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        margin: "8px 0 12px 0",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#7c2d12",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {anyBelowMin &&
                        "⚠️ One or more gross loans are below the £150,000 minimum threshold. "}
                      {anyAtMaxCap &&
                        "ⓘ One or more gross loans are capped at the £3,000,000 maximum."}
                    </div>
                  )}

                  {/* Labels */}
                  <div
                    className="matrixLabels"
                    style={{
                      display: "grid",
                      gridTemplateRows: `
                        55px
                        48px 48px 48px 48px 48px
                        48px 48px 48px 65px 48px 

                      `,
                    }}
                  >
                    <div className="labelsHead"></div>
                    <div className="mRow"><b>Product Name</b></div>
                    <div className="mRow"><b>Full Rate</b></div>
                    <div className="mRow"><b>Pay Rate</b></div>
                    <div className="mRow">
                      <b>
                        Net Loan <span style={{ fontSize: "11px", fontWeight: 400 }}>(advanced day 1)</span>
                      </b>
                    </div>
                    <div className="mRow">
                      <b>
                        Max Gross Loan <span style={{ fontSize: "11px", fontWeight: 400 }}>(paid at redemption)</span>
                      </b>
                    </div>


                    <div className="mRow"><b>Product Fee</b></div>
                    
                    <div className="mRow"><b>Direct Debit</b></div>
                    <div className="mRow"><b>Revert Rate</b></div>
                    <div className="mRow"><b>Total Term | ERC</b></div>
                    <div className="mRow"><b>Max Product LTV</b></div>
                  </div>

                  {/* Columns */}
                  {colData.map(([colKey, data], idx) => {
                    const headClass =
                      idx === 0 ? "headGreen" : idx === 1 ? "headOrange" : idx === 2 ? "headTeal" : "headBlue";

                    return (
                      <div
                        key={colKey}
                        className="matrixCol"
                        style={{
                          display: "grid",
                          gridTemplateRows: `
                            55px
                            48px 48px 48px 48px 48px
                            48px 48px 48px 65px 48px 
                          `,
                        }}
                      >
                        <div className={`matrixHead ${headClass}`}>BTL, {Number(colKey)}% Product Fee</div>

                        <div className="mRow"><div className="mValue" style={valueBoxStyle}>{data.productName}</div></div>
                        <div className="mRow"><div className="mValue" style={valueBoxStyle}>{data.fullRateText}</div></div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {data.payRateText}
                          </div>
                        </div>
                        <div className="mRow"><div className="mValue" style={valueBoxStyle}>{fmtMoney0(data.net)}</div></div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            <span style={{ fontWeight: 700 }}>{fmtMoney0(data.gross)}</span>
                            {data.ltv != null && (
                              <span style={{ fontWeight: 400 }}>
                                {" "} @ {Math.round(data.ltv * 100)}% LTV
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {fmtMoney0(data.feeAmt)} ({Number(colKey).toFixed(2)}%)
                          </div>
                        </div>
                        
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {fmtMoney0(data.directDebit)} from month 1
                          </div>
                        </div>
                        <div className="mRow"><div className="mValue" style={valueBoxStyle}>{formatRevertRate(tier)}</div></div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {TOTAL_TERM} years | {formatERC(productType)}
                          </div>
                        </div>
                        <div className="mRow"><div className="mValue" style={valueBoxStyle}>{(data.maxLTVRule * 100).toFixed(0)}%</div></div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ------------- EXTRA: Basic Gross (aligned under columns) + MVR/BBR ---- */}
      {canShowMatrix && (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          {/* advisory line */}
          <div
            style={{
              textAlign: "center",
              color: "#7c2d12",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            This product does not have rolled or deferred interest.
          </div>

          {/* Use the SAME .matrix grid so columns line up perfectly */}
          <div className="matrix" style={{ rowGap: 0 }}>
            
            {/* Footer line under the aligned row */}
            <div style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: 12, fontSize: 12, color: "#334155" }}>
              <span style={{ marginRight: 16 }}>
                <b>MVR (Market Financial Solutions Variable Rate)</b> is currently{" "}
                {(CURRENT_MVR * 100).toFixed(2)}%
              </span>
              <span>
                <b>BBR</b> is currently {(STANDARD_BBR * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);