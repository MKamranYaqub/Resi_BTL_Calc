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
const MAX_ROLLED_MONTHS = 6;
const MAX_DEFERRED_FIX = 0.0125; // 1.25%
const MAX_DEFERRED_TRACKER = 0.015; // 1.50%
const SHOW_FEE_COLS = ["6", "4", "2"];

/* EmailJS credentials (override via window.EMAILJS_* if you prefer) */
const EMAILJS_PUBLIC_KEY = window.EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = window.EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = window.EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID";

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

function formatRevertRate(tier) {
  const add = window.REVERT_RATE_Commercial?.[tier]?.add ?? 0;
  return add === 0 ? "MVR" : `MVR + ${(add * 100).toFixed(2)}%`;
}
function formatERC(productType) {
  const ercArr = window.ERC_Commercial?.[productType] ?? ["—"];
  return ercArr.join(" / ");
}

// Placeholder for missing function
function getMaxLTV(tier, flatAboveComm) {
  // This function's logic is missing, so we'll provide a placeholder.
  // In a real application, this would come from a data source or be more complex.
  if (tier === "Tier 2" || flatAboveComm === "Yes") {
    return 0.7; // Example LTV for Tier 2 or flat above commercial
  }
  return 0.70; // Example default LTV
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

  // Property & income
  const [propertyValue, setPropertyValue] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");

  // Property drivers
  const [hmo, setHmo] = useState("No (Tier 1)");
  const [mufb, setMufb] = useState("No (Tier 1)");
  const [holiday, setHoliday] = useState("No");
  const [flatAboveComm, setFlatAboveComm] = useState("No");
  const [ownerocc, setOwnerocc] = useState("No");
  const [devexit, setDevexit] = useState("No");

  // Applicant drivers
  const [expat, setExpat] = useState("No (Tier 1)");
  const [ftl, setFtl] = useState("No");
  const [offshore, setOffshore] = useState("No");

  // Adverse
  const [adverse, setAdverse] = useState("No");
  const [mortArrears, setMortArrears] = useState("0 in 24");
  const [unsArrears, setUnsArrears] = useState("0 in 24");
  const [ccjDefault, setCcjDefault] = useState("0 in 24");
  const [bankruptcy, setBankruptcy] = useState("Never");

  // Tier
  const tier = useMemo(() => {
    const mapHmo = {
      "No (Tier 1)": 1,
      "Up to 12 beds (Tier 1)": 1,
      "More than 12 beds (Tier 2)": 2,
    };
    const mapMufb = {
      "No (Tier 1)": 1,
      "Up to 12 units (Tier 1)": 1,
      "More than 12 units (Tier 2)": 2,
    };
    const mapExp = {
      "No (Tier 1)": 1,
      "Yes (Tier 2)": 2,
    };

    let t = 1;
    t = Math.max(t, mapHmo[hmo] || 1);
    t = Math.max(t, mapMufb[mufb] || 1);
    t = Math.max(t, mapExp[expat] || 1);

    if (ownerocc === "Yes") t = Math.max(t, 2);
    if (devexit === "Yes") t = Math.max(t, 2);
    if (flatAboveComm === "Yes") t = Math.max(t, 2);
    if (ftl === "Yes") t = Math.max(t, 2);
    if (offshore === "Yes") t = Math.max(t, 2);

    if (adverse === "Yes") {
      const advMapMA = {
        "0 in 24": 1,
        "0 in 18": 1,
        "2 in 18, 0 in 6": 2,
        "Other, more recent": 2,
      };
      const advMapUA = {
        "0 in 24": 1,
        "0 in 12": 1,
        "2 in last 18": 2,
        "Other, more recent": 2,
      };
      const advMapCD = {
        "0 in 24": 1,
        "0 in 18": 1,
        "2 in 18, 0 in 6": 2,
        "Other, more recent": 2,
      };
      const advMapBank = {
        Never: 1,
        "Discharged >3yrs": 1,
        "All considered by referral": 2,
      };
      const adverseTier = Math.max(
        advMapMA[mortArrears] || 1,
        advMapUA[unsArrears] || 1,
        advMapCD[ccjDefault] || 1,
        advMapBank[bankruptcy] || 1
      );
      t = Math.max(t, adverseTier);
    }

    return t === 1 ? "Tier 1" : "Tier 2";
  }, [
    hmo,
    mufb,
    expat,
    ownerocc,
    devexit,
    flatAboveComm,
    ftl,
    offshore,
    adverse,
    mortArrears,
    unsArrears,
    ccjDefault,
    bankruptcy,
  ]);

  const selected =
    window.RATES_Commercial?.[tier]?.products?.[productType] || {};

  const isTracker = !!selected?.isMargin;

  // External constants
  const MIN_ICR_FIX = window.MIN_ICR_Commercial?.Fix ?? 1.25;
  const MIN_ICR_TRK = window.MIN_ICR_Commercial?.Tracker ?? 1.3;
  const MIN_LOAN = window.MIN_LOAN_Commercial ?? 150000;
  const MAX_LOAN = window.MAX_LOAN_Commercial ?? 2000000;
  const STANDARD_BBR = window.STANDARD_BBR_Commercial ?? 0.04;
  const STRESS_BBR = window.STRESS_BBR_Commercial ?? 0.0425;
  const TERM_MONTHS = window.TERM_MONTHS_Commercial ?? {
    "2yr Fix": 24,
    "3yr Fix": 36,
    "2yr Tracker": 24,
    Tracker: 24, // backward-compat
  };
  const TOTAL_TERM = window.TOTAL_TERM_Commercial ?? 10;
  const LEAD_TO = window.LEAD_TO_Commercial ?? "leads@example.com";
  const CURRENT_MVR = window.CURRENT_MVR_Commercial ?? 0.0859;

  /* ------------------------------ Calculations ----------------------------- */
  const canShowMatrix = useMemo(() => {
    const mr = toNumber(monthlyRent);
    const pv = toNumber(propertyValue);
    const sn = toNumber(specificNetLoan);
    if (!mr) return false;
    if (useSpecificNet === "Yes") return !!sn;
    return !!pv;
  }, [monthlyRent, propertyValue, specificNetLoan, useSpecificNet]);

  // Main per-column calculation (with rolled/deferred caps)
  function computeForCol(colKey) {
    const feePct = Number(colKey) / 100;
    const base = selected?.[colKey];
    if (base == null) return null;

    const displayRate = isTracker ? base + STANDARD_BBR : base;

    const fullRateText = isTracker
      ? `${(base * 100).toFixed(2)}% + BBR`
      : `${(base * 100).toFixed(2)}%`;

    const deferredCap = isTracker ? MAX_DEFERRED_TRACKER : MAX_DEFERRED_FIX;
    const payRateAdj = Math.max(displayRate - deferredCap, 0);
    const payRateText = isTracker
      ? `${((base - deferredCap) * 100).toFixed(2)}% + BBR`
      : `${(payRateAdj * 100).toFixed(2)}%`;

    const pv = toNumber(propertyValue);
    const mr = toNumber(monthlyRent);

    const minICR = productType.includes("Fix") ? MIN_ICR_FIX : MIN_ICR_TRK;
    const maxLTV = getMaxLTV(tier, flatAboveComm);
    const grossLTV = pv ? pv * maxLTV : Infinity;

    const stressRate = isTracker ? base + STRESS_BBR : displayRate;
    const termMonths = TERM_MONTHS[productType] ?? 24;
    const rolledMonths = Math.min(MAX_ROLLED_MONTHS, termMonths);
    const monthsLeft = Math.max(termMonths - rolledMonths, 1);
    const stressAdj = Math.max(stressRate - deferredCap, 1e-6);

    let grossRent = Infinity;
    if (mr && stressAdj) {
      const annualRent = mr * 12; // Assuming annual rent for ICR calculation
      grossRent = annualRent / (minICR * stressAdj);
    }

    const N_input = toNumber(specificNetLoan);
    let grossFromNet = null;
    if (N_input && useSpecificNet === "Yes") {
      const rolledFactor = (displayRate - deferredCap) * (rolledMonths / 12);
      const numerator = N_input + N_input * rolledFactor;
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
    const rolled =
      ((eligibleGross * (displayRate - deferredCap)) / 12) * rolledMonths;
    const deferred = ((eligibleGross * deferredCap) / 12) * termMonths;
    const net = eligibleGross - feeAmt - rolled - deferred;
    const ltv = pv ? eligibleGross / pv : null;
    const ddAmount = eligibleGross * (payRateAdj / 12);

    return {
      productName: `${productType}, ${tier}, ${Number(colKey)}% Fee`,
      fullRateText,
      payRateText,
      deferredCapPct: deferredCap,
      net,
      gross: eligibleGross,
      feeAmt,
      rolled,
      deferred,
      ltv,
      rolledMonths,
      directDebit: ddAmount,
      maxLtvRule: maxLTV,
      termMonths,
      belowMin,
      hitMaxCap,
    };
  }

  // "Basic Gross" per column: **no rolled months, no deferred interest**
  function computeBasicGrossForCol(colKey) {
    const base = selected?.[colKey];
    if (base == null) return null;

    const pv = toNumber(propertyValue);
    const mr = toNumber(monthlyRent);

    const minICR = productType.includes("Fix") ? MIN_ICR_FIX : MIN_ICR_TRK;
    const maxLTV = getMaxLTV(tier, flatAboveComm);
    const grossLTV = pv ? pv * maxLTV : Infinity;

    const displayRate = isTracker ? base + STANDARD_BBR : base;
    const stressRate = isTracker ? base + STRESS_BBR : displayRate;

    const deferredCap = 0;
    const monthsLeft = 12; // ICR is annual
    const stressAdj = Math.max(stressRate - deferredCap, 1e-6);

    let grossRent = Infinity;
    if (mr && stressAdj) {
      const annualRent = mr * 12;
      grossRent = annualRent / (minICR * stressAdj);
    }

    const eligibleGross = Math.min(grossLTV, grossRent, MAX_LOAN);
    const ltvPct = pv ? Math.round((eligibleGross / pv) * 100) : null;

    return {
      grossBasic: eligibleGross,
      ltvPctBasic: ltvPct,
    };
  }

  // Best summary across the four columns (by gross)
  const bestSummary = useMemo(() => {
    if (!canShowMatrix) return null;
    const pv = toNumber(propertyValue) || 0;

    const items = SHOW_FEE_COLS.map((k) => [k, computeForCol(k)]).filter(
      ([, d]) => !!d
    );

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
  }, [
    productType,
    tier,
    propertyValue,
    monthlyRent,
    useSpecificNet,
    specificNetLoan,
    flatAboveComm,
    canShowMatrix,
  ]);

  /* --------------------------- Email via EmailJS ---------------------------- */
  function buildEmailHtml(colData) {
    const safe = (v) => (v == null ? "—" : v);

    const inputsHtml = `
      <h3 style="margin:0 0 6px">Client</h3>
      <table cellspacing="0" cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Name</b></td><td>${safe(clientName)}</td></tr>
        <tr><td><b>Phone</b></td><td>${safe(clientPhone)}</td></tr>
        <tr><td><b>Email</b></td><td>${safe(clientEmail)}</td></tr>
      </table>
      <h3 style="margin:16px 0 6px">Case Inputs</h3>
      <table cellspacing="0" cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Tier</b></td><td>${tier}</td></tr>
        <tr><td><b>Product Type</b></td><td>${productType}</td></tr>
        <tr><td><b>Property Value</b></td><td>${safe(propertyValue)}</td></tr>
        <tr><td><b>Monthly Rent</b></td><td>${safe(monthlyRent)}</td></tr>
        <tr><td><b>Specific Net Used</b></td><td>${useSpecificNet}</td></tr>
        ${
          useSpecificNet === "Yes"
            ? `<tr><td><b>Specific Net</b></td><td>${safe(
                specificNetLoan
              )}</td></tr>`
            : ""
        }
      </table>
    `;

    const colsHtml = colData
      .map(([key, d]) => {
        return `
          <h4 style="margin:16px 0 6px">BTL, ${Number(key)}% Product Fee</h4>
          <table cellspacing="0" cellpadding="6" style="border-collapse:collapse">
            <tr><td><b>Product Name</b></td><td>${d.productName}</td></tr>
            <tr><td><b>Full Rate</b></td><td>${d.fullRateText}</td></tr>
            <tr><td><b>Pay Rate</b></td><td>${d.payRateText} (using ${(
          d.deferredCapPct * 100
        ).toFixed(2)}% deferred cap)</td></tr>
            <tr><td><b>Net Loan</b></td><td>${fmtMoney0(d.net)}</td></tr>
            <tr><td><b>Max Gross Loan</b></td><td>${fmtMoney0(
              d.gross
            )}</td></tr>
            <tr><td><b>Product Fee</b></td><td>${fmtMoney0(d.feeAmt)} (${Number(
          key
        ).toFixed(2)}%)</td></tr>
            <tr><td><b>Rolled Interest</b></td><td>${fmtMoney0(d.rolled)} (${
          d.rolledMonths
        } months)</td></tr>
            <tr><td><b>Deferred Interest</b></td><td>${fmtMoney0(
              d.deferred
            )} (${(d.deferredCapPct * 100).toFixed(2)}%)</td></tr>
            <tr><td><b>Direct Debit</b></td><td>${fmtMoney0(
              d.directDebit
            )} from month ${MAX_ROLLED_MONTHS + 1}</td></tr>
            <tr><td><b>Revert Rate</b></td><td>${formatRevertRate(
              tier
            )}</td></tr>
            <tr><td><b>Total term | ERC</b></td><td>${TOTAL_TERM} years | ${formatERC(
          productType
        )}</td></tr>
            <tr><td><b>Max Product LTV</b></td><td>${(
              d.maxLtvRule * 100
            ).toFixed(0)}%</td></tr>
          </table>
        `;
      })
      .join("");

    return `
      <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial">
        <h2 style="margin:0 0 8px">MFS BTL Residential – Illustration</h2>
        <div style="font-size:13px;color:#334155;margin:0 0 12px">
          Generated for <b>${clientName || "Client"}</b>
        </div>
        ${inputsHtml}
        <h3 style="margin:16px 0 6px">Products</h3>
        ${colsHtml}
      </div>
    `;
  }

  async function sendLeadEmail() {
    if (!clientEmail) {
      alert("Please enter the client’s email address.");
      return;
    }
    if (!window.emailjs) {
      alert(
        'EmailJS script not found. Add it to index.html:\n<script src="https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js"></script>'
      );
      return;
    }
    try {
      if (!window.__emailjs_inited) {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        window.__emailjs_inited = true;
      }

      const colData = SHOW_FEE_COLS.map((k) => [k, computeForCol(k)]).filter(
        ([, d]) => !!d
      );

      const html = buildEmailHtml(colData);

      setSending(true);

      const params = {
        to_email: clientEmail,
        cc_email: LEAD_TO,
        from_name: clientName || "Client",
        reply_to: clientEmail,
        subject: `BTL illustration – ${productType} | ${tier}`,
        message_html: html, // use {{message_html}} in your EmailJS template
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);

      alert("Email sent successfully 🎉");
    } catch (err) {
      console.error(err);
      alert(
        "Email failed to send. Please check your EmailJS IDs and template."
      );
    } finally {
      setSending(false);
    }
  }

  /* --------------------------- Inline value styles -------------------------- */
  const valueBoxStyle = {
    width: "100%",
    textAlign: "center",
    fontWeight: 400, // values NOT bold
    background: "#e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
  };

  return (
    <div className="container">
      {/* --------------------- Property Details (full width) -------------------- */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>MFS BTL Commercial Calculator</h3>
        <div className="note" style={{ marginBottom: 8 }}>
          Tier is calculated automatically from the inputs below. Current:{" "}
          <b>{tier}</b>
        </div>

        <div className="profile-grid">
          <SectionTitle>Property Type</SectionTitle>

          <div className="field">
            <label>HMO</label>
            <select value={hmo} onChange={(e) => setHmo(e.target.value)}>
              <option>No (Tier 1)</option>
              <option>Up to 12 beds (Tier 1)</option>
              <option>More than 12 beds (Tier 2)</option>
            </select>
          </div>

          <div className="field">
            <label>MUFB</label>
            <select value={mufb} onChange={(e) => setMufb(e.target.value)}>
              <option>No (Tier 1)</option>
              <option>Up to 12 units (Tier 1)</option>
              <option>More than 12 units (Tier 2)</option>
            </select>
          </div>
          <div className="field">
            <label>Owner Occupier?</label>
            <select
              value={ownerocc}
              onChange={(e) => setOwnerocc(e.target.value)}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>
          <div className="field">
            <label>Developer Exit?</label>
            <select
              value={devexit}
              onChange={(e) => setDevexit(e.target.value)}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>
          <SectionTitle>Applicant Details</SectionTitle>

          <div className="field">
            <label>Expat / Foreign National</label>
            <select value={expat} onChange={(e) => setExpat(e.target.value)}>
              <option>No (Tier 1)</option>
              <option>Yes (Tier 2)</option>
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
            <label>Offshore company?</label>
            <select
              value={offshore}
              onChange={(e) => setOffshore(e.target.value)}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <div className="field">
            <label>Adverse Credit?</label>
            <select
              value={adverse}
              onChange={(e) => setAdverse(e.target.value)}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          {adverse === "Yes" && (
            <>
              <div className="field">
                <label>Mortgage Arrears</label>
                <select
                  value={mortArrears}
                  onChange={(e) => setMortArrears(e.target.value)}
                >
                  <option>0 in 24</option>
                  <option>0 in 18</option>
                  <option>2 in 18, 0 in 6</option>
                </select>
              </div>

              <div className="field">
                <label>Unsecured Arrears</label>
                <select
                  value={unsArrears}
                  onChange={(e) => setUnsArrears(e.target.value)}
                >
                  <option>0 in 24</option>
                  <option>0 in 12</option>
                  <option>2 in last 18</option>
                </select>
              </div>

              <div className="field">
                <label>CCJ & Defaults</label>
                <select
                  value={ccjDefault}
                  onChange={(e) => setCcjDefault(e.target.value)}
                >
                  <option>0 in 24</option>
                  <option>0 in 18</option>
                  <option>2 in 18, 0 in 6</option>
                </select>
              </div>

              <div className="field">
                <label>Bankruptcy</label>
                <select
                  value={bankruptcy}
                  onChange={(e) => setBankruptcy(e.target.value)}
                >
                  <option>Never</option>
                  <option>Discharged &gt;3yrs</option>
                  <option>All considered by referral</option>
                </select>
              </div>
            </>
          )}

          <SectionTitle>Property & Product</SectionTitle>

          <div
            className="profile-grid property-product"
            style={{ gridColumn: "1 / -1" }}
          >
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
              <select
                value={useSpecificNet}
                onChange={(e) => setUseSpecificNet(e.target.value)}
              >
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
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
              >
                {/* Fallback array if window.PRODUCT_TYPES_Commercial is not defined */}
                {(
                  window.PRODUCT_TYPES_Commercial || [
                    "2yr Fix",
                    "3yr Fix",
                    "2yr Tracker",
                  ]
                ).map((p) => (
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
        <h3>Client Details & Lead</h3>
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
              onClick={sendLeadEmail}
              className="primaryBtn"
              disabled={sending}
            >
              {sending ? "Sending…" : "Send Email"}
            </button>
            <div className="note"></div>
          </div>
        </div>
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
              {bestSummary.grossStr} @ {bestSummary.grossLtvPct}% LTV,{" "}
              {productType}, {tier}, {Number(bestSummary.colKey)}% Fee
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
              const colData = SHOW_FEE_COLS.map((k) => [
                k,
                computeForCol(k),
              ]).filter(([, d]) => !!d);
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
                        `⚠️ One or more gross loans are below the £${MIN_LOAN.toLocaleString()} minimum threshold. `}
                      {anyAtMaxCap &&
                        `ⓘ One or more gross loans are capped at the £${MAX_LOAN.toLocaleString()} maximum.`}
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
                        48px 48px 48px 48px 48px 48px 48px
                      `,
                    }}
                  >
                    <div className="labelsHead"></div>
                    <div className="mRow">
                      <b>Product Name</b>
                    </div>
                    <div className="mRow">
                      <b>Full Rate</b>
                    </div>
                    <div className="mRow">
                      <b>Pay Rate</b>
                    </div>
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
                    <div className="mRow">
                      <b>Product Fee</b>
                    </div>
                    <div className="mRow">
                      <b>Rolled Months Interest</b>
                    </div>
                    <div className="mRow">
                      <b>Deferred Interest</b>
                    </div>
                    <div className="mRow">
                      <b>Direct Debit</b>
                    </div>
                    <div className="mRow">
                      <b>Revert Rate</b>
                    </div>
                    <div className="mRow">
                      <b>Total Term | ERC</b>
                    </div>
                    <div className="mRow">
                      <b>Max Product LTV</b>
                    </div>
                  </div>

                  {/* Columns */}
                  {colData.map(([colKey, data], idx) => {
                    const headClass =
                      idx === 0
                        ? "headGreen"
                        : idx === 1
                        ? "headOrange"
                        : idx === 2
                        ? "headTeal"
                        : "headBlue";

                    return (
                      <div
                        key={colKey}
                        className="matrixCol"
                        style={{
                          display: "grid",
                          gridTemplateRows: `
                            55px
                            48px 48px 48px 48px 48px
                            48px 48px 48px 48px 48px 48px 48px
                          `,
                        }}
                      >
                        <div className={`matrixHead ${headClass}`}>
                          BTL, {Number(colKey)}% Product Fee
                        </div>

                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {data.productName}
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {data.fullRateText}
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {data.payRateText}
                            <span
                              style={{
                                fontWeight: 500,
                                fontSize: 10,
                                marginLeft: 6,
                              }}
                            >
                              (using {(data.deferredCapPct * 100).toFixed(2)}%
                              deferred cap)
                            </span>
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {fmtMoney0(data.net)}
                          </div>
                        </div>
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
                            {fmtMoney0(data.feeAmt)} (
                            {Number(colKey).toFixed(2)}%)
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {fmtMoney0(data.rolled)} ({data.rolledMonths}{" "}
                            months)
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {fmtMoney0(data.deferred)} (
                            {(data.deferredCapPct * 100).toFixed(2)}%)
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {fmtMoney0(data.directDebit)} from month{" "}
                            {MAX_ROLLED_MONTHS + 1}
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {formatRevertRate(tier)}
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {TOTAL_TERM} years | {formatERC(productType)}
                          </div>
                        </div>
                        <div className="mRow">
                          <div className="mValue" style={valueBoxStyle}>
                            {(data.maxLtvRule * 100).toFixed(0)}%
                          </div>
                        </div>
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
            Results currently use maximum rolled months & deferred interest.
            Speak with an underwriter for a customised loan illustration which
            can utilise less rolled and deferred interest (which can increase
            the net loan on day 1).
          </div>

          {/* Use the SAME .matrix grid so columns line up perfectly */}
          <div className="matrix" style={{ rowGap: 0 }}>
            {/* labels spacer column (same width as above: 200px) */}
            <div
              className="matrixLabels"
              style={{
                display: "grid",
                gridTemplateRows: `48px`,
                border: "1px solid transparent",
                background: "transparent",
              }}
            >
              <div
                className="mRow"
                style={{ justifyContent: "center", color: "#475569" }}
              >
                <b>Basic Gross (no roll/deferred)</b>
              </div>
            </div>

            {/* one aligned row per product column */}
            {SHOW_FEE_COLS.map((k, idx) => {
              const d = computeBasicGrossForCol(k);
              if (!d) return null;

              const headClass =
                idx === 0
                  ? "headGreen"
                  : idx === 1
                  ? "headOrange"
                  : idx === 2
                  ? "headTeal"
                  : "headBlue";

              return (
                <div
                  key={`basic-${k}`}
                  className="matrixCol"
                  style={{
                    display: "grid",
                    gridTemplateRows: `48px`,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                >
                  <div className="mRow" style={{ padding: 6 }}>
                    <div
                      className="mValue"
                      style={{
                        width: "100%",
                        textAlign: "center",
                        fontWeight: 800,
                        background: "#f1f5f9",
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      {fmtMoney0(d.grossBasic)}{" "}
                      <span style={{ fontWeight: 700 }}>
                        @{" "}
                        {d.ltvPctBasic != null ? `${d.ltvPctBasic}% LTV` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Footer line under the aligned row */}
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                marginTop: 12,
                fontSize: 12,
                color: "#334155",
              }}
            >
              <span style={{ marginRight: 16 }}>
                <b>MVR (Market Financial Solutions Variable Rate)</b> is
                currently {(CURRENT_MVR * 100).toFixed(2)}%
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
