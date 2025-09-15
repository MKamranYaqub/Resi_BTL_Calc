// fusion_calc.js

const { useState, useMemo, useCallback } = React;

/* --------------------------------- UTILITY FUNCTIONS --------------------------------- */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const fmtMoney0 = (n) =>
  n || n === 0
    ? n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
    : "—";
const fmtPct = (p, dp = 2) =>
  p || p === 0 ? `${(p * 100).toFixed(dp)}%` : "—";

/* >>> NEW: same validation helpers used in calc.js <<< */
const isValidEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
const cleanDigits = (v) => String(v).replace(/[^\d]/g, "");
const isValidPhone = (v) => {
  const d = cleanDigits(v);
  return d.length >= 10 && d.length <= 15; // UK/intl tolerances
};

/* ----------------------------------- MAIN APP COMPONENT ----------------------------------- */
function App() {
  // Input state variables
  const [propertyType, setPropertyType] = useState("Residential");
  const [grossLoanInput, setGrossLoanInput] = useState("3000000");
  const [propertyValue, setPropertyValue] = useState("4000000");
  const [rolledMonths, setRolledMonths] = useState("6");
  const [deferredInterest, setDeferredInterest] = useState(0.01);
  const [useSpecificNet, setUseSpecificNet] = useState("No");
  const [specificNetLoan, setSpecificNetLoan] = useState("");

  // State for specific error messages (calc gating)
  const [errorMessage, setErrorMessage] = useState("");

  // Client details
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // 'success', 'error', or null

  /* >>> NEW: inline validation feedback for lead form (mirrors calc.js pattern) <<< */
  const [validationError, setValidationError] = useState("");

  // Constants from rates file
  const BBR = window.FUSION_BBR || 0.04;
  const ARRANGEMENT_FEE_PCT = window.FUSION_ARRANGEMENT_FEE_PCT || 0.02;
  const TERM_MONTHS = window.FUSION_TERM_MONTHS || 24;
  const ERC_DETAILS = window.FUSION_ERC || "N/A";
  const LTV_CAPS = window.FUSION_LTV_CAPS || {
    'Residential': 0.75,
    'Semi / Full Commercial': 0.70
  };
  const PRODUCTS = window.FUSION_PRODUCTS || {};
  const MIN_LOAN_AMOUNT = 100000;

  const calculation = useMemo(() => {
    setErrorMessage("");

    const pv = toNumber(propertyValue);
    const snl = toNumber(specificNetLoan);
    const rm = toNumber(rolledMonths);
    const di = toNumber(deferredInterest);
    const gl = toNumber(grossLoanInput);

    // --- 1. Initial Input Validation ---
    if (useSpecificNet === "No" && gl && gl < MIN_LOAN_AMOUNT) {
      setErrorMessage(`The minimum loan amount is ${fmtMoney0(MIN_LOAN_AMOUNT)}.`);
      return null;
    }
    if (useSpecificNet === "No" && !gl) {
      setErrorMessage(`Please enter a valid Gross Loan amount. The minimum is ${fmtMoney0(MIN_LOAN_AMOUNT)}.`);
      return null;
    }
    if (useSpecificNet === "Yes" && (!snl || snl <= 0)) {
      setErrorMessage("Please enter a valid Specific Net Loan amount.");
      return null;
    }
    if (!pv || pv <= 0) {
      setErrorMessage("Please enter a valid Property Value.");
      return null;
    }

    // --- 2. Determine Preliminary Gross Loan and Find Product ---
    let preliminaryGrossLoan = 0;
    if (useSpecificNet === "Yes") {
      const approxCouponRate = PRODUCTS[propertyType]?.Small?.rate || 0.05;
      const rolledFactorApprox = (((approxCouponRate - di) + BBR) / 12) * rm;
      const deferredFactor = (di / 12) * TERM_MONTHS;
      const denominatorApprox = 1 - ARRANGEMENT_FEE_PCT - rolledFactorApprox - deferredFactor;

      if (denominatorApprox <= 0) {
        setErrorMessage("The combination of fees and costs is not feasible.");
        return null;
      }
      preliminaryGrossLoan = snl / denominatorApprox;
    } else {
      preliminaryGrossLoan = gl;
    }

    const productTier = PRODUCTS[propertyType];
    if (!productTier) {
      setErrorMessage("No products available for the selected property type.");
      return null;
    }

    let eligibleProduct = null;
    for (const key in productTier) {
      const product = productTier[key];
      if (preliminaryGrossLoan >= product.minLoan && preliminaryGrossLoan <= product.maxLoan) {
        eligibleProduct = { name: key, ...product };
        break;
      }
    }

    if (!eligibleProduct) {
      setErrorMessage(`The loan amount of ${fmtMoney0(preliminaryGrossLoan)} does not fall into any available product category.`);
      return null;
    }

    // --- 3. Final Calculation and LTV Check ---
    const couponRate = eligibleProduct.rate;
    let initialGrossLoan = 0;

    if (useSpecificNet === "Yes") {
      const rolledFactor = (((couponRate - di) + BBR) / 12) * rm;
      const deferredFactor = (di / 12) * TERM_MONTHS;
      const denominator = 1 - ARRANGEMENT_FEE_PCT - rolledFactor - deferredFactor;

      if (denominator <= 0) {
        setErrorMessage("The combination of fees and costs is not feasible with this product's rate.");
        return null;
      }
      initialGrossLoan = snl / denominator;
    } else {
      initialGrossLoan = gl;
    }

    const maxLtv = LTV_CAPS[propertyType] || 0.75;
    const calculatedLtv = initialGrossLoan / pv;
    const epsilon = 1e-9;

    if (calculatedLtv > maxLtv + epsilon) {
      const maxLoanFromLtv = pv * maxLtv;
      setErrorMessage(`The requested loan of ${fmtMoney0(initialGrossLoan)} exceeds the maximum LTV of ${fmtPct(maxLtv)} for this property type. The maximum loan is ${fmtMoney0(maxLoanFromLtv)}.`);
      return null;
    }

    const grossLoan = initialGrossLoan;

    if (grossLoan < eligibleProduct.minLoan || grossLoan > eligibleProduct.maxLoan) {
      setErrorMessage("After applying LTV limits, the loan amount no longer fits the selected product category.");
      return null;
    }

    // --- 4. Success - Calculate Remaining Details ---
    const arrangementFee = grossLoan * ARRANGEMENT_FEE_PCT;
    const rolledCost = (grossLoan * (couponRate+BBR - di) / 12) * rm;
    const fullRate = couponRate + BBR;
    const payRate = (couponRate - di) + BBR;
    const deferredCost = (grossLoan * di / 12) * TERM_MONTHS;
    const netLoan = grossLoan - arrangementFee - rolledCost - deferredCost;
    const totalInterest = (grossLoan * fullRate / 12) * TERM_MONTHS;
    const monthlyDirectDebit = (grossLoan * payRate) / 12;

    return {
      productName: `${propertyType} Fusion ${eligibleProduct.name}`,
      productColor: eligibleProduct.name.toLowerCase(),
      couponRate,
      deferredRate: di,
      fullRate,
      payRate,
      grossLoan,
      netLoan,
      ltv: calculatedLtv,
      maxProductLtv: maxLtv,
      arrangementFee,
      term: `${TERM_MONTHS} Months (12m Extension Possible)`,
      erc: ERC_DETAILS,
      serviceMonths:  TERM_MONTHS - rm,
      rm,
      rolledCost,
      deferredCost,
      totalInterest,
      monthlyDirectDebit,
    };
  }, [propertyType, grossLoanInput, propertyValue, rolledMonths, deferredInterest, useSpecificNet, specificNetLoan]);

  /* ------------------------ Send Quote via Email (with validation like calc.js) ------------------------ */
  const handleSendToZapier = async () => {
    setSending(true);
    setEmailStatus(null);
    setValidationError("");  // NEW: clear lead validation each attempt

    // Match calc.js gating: require a completed calculation before sending
    if (!calculation) {
      setValidationError("Please complete the calculation fields before sending email.");
      setSending(false);
      return;
    }

    // Require all three fields (same pattern as calc.js)
    if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim()) {
      setValidationError("Please complete all client fields before sending email.");
      setSending(false);
      return;
    }

    // Email format
    if (!isValidEmail(clientEmail)) {
      setValidationError("Please enter a valid email address.");
      setSending(false);
      return;
    }

    // Phone sanity (use digits length like calc.js helper)
    if (!isValidPhone(clientPhone)) {
      setValidationError("Please enter a valid contact number.");
      setSending(false);
      return;
    }

    const zapierWebhookUrl = "https://hooks.zapier.com/hooks/catch/10082441/utq78nr/";

    const payload = {
      // Inputs
      clientName, clientPhone, clientEmail,
      propertyType, propertyValue, grossLoanInput,
      useSpecificNet, specificNetLoan, rolledMonths, deferredInterest,
      // Outputs
      ...calculation,
      submissionTimestamp: new Date().toISOString(),
    };

    try {
      // Keep your original, simple form-encoded POST (no formatting changes)
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(payload)) {
        form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));
      }

      const res = await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: form.toString(),
      });

      if (res.ok) {
        setEmailStatus("success");
      } else {
        setEmailStatus("error");
      }
    } catch (err) {
      console.error("Error sending quote via Zapier:", err);
      setEmailStatus("error");
    } finally {
      setSending(false);
    }
  };

  const headerColors = {
    small: '#ED8B00',
    medium: '#ED8B00',
    large: '#ED8B00',
  };

  return (
    <div className="container p-4">
      <div className="card mb-4">
        <div className="p-4">
          {/* ADDED HEADING HERE */}
          <h5>Loan Details</h5>
          <div className="row g-3">
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Property Type</label>
                <select className="form-select" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option>Residential</option>
                  <option>Semi / Full Commercial</option>
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Property Value (£)</label>
                <input type="number" className="form-control" placeholder="e.g. 1000000" value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)} />
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Use Specific Net Loan?</label>
                <select className="form-select" value={useSpecificNet} onChange={(e) => setUseSpecificNet(e.target.value)}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </div>
            </div>
            {useSpecificNet === 'Yes' ? (
              <div className="col-lg-3 col-md-6 col-12">
                <div className="field">
                  <label className="form-label">Specific Net Loan (£)</label>
                  <input type="number" className="form-control" placeholder="e.g. 450,000" value={specificNetLoan} onChange={(e) => setSpecificNetLoan(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="col-lg-3 col-md-6 col-12">
                <div className="field">
                  <label className="form-label">Gross Loan (£)</label>
                  <input type="number" className="form-control" placeholder="e.g. 750,000" value={grossLoanInput} onChange={(e) => setGrossLoanInput(e.target.value)} />
                  <div className="field-helper form-text">Product is selected automatically based on this amount.</div>
                </div>
              </div>
            )}
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Months to be Rolled</label>
                <select className="form-select" value={rolledMonths} onChange={(e) => setRolledMonths(e.target.value)}>
                  {[...Array(7).keys()].map(i => <option key={i+6}>{i + 6}</option>)}
                </select>
                <div className="field-helper form-text">Interest for these months is added to the loan.</div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Deferred Interest</label>
                <div className="slider-container">
                  <input type="range" className="form-range" min="0" max="0.02" step="0.0005" value={deferredInterest} onChange={e => setDeferredInterest(parseFloat(e.target.value))} />
                  <span className="slider-value">{fmtPct(deferredInterest)}</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-12 ms-auto">
              <div className="p-3 bg-light border rounded" style={{ maxWidth: '300px' }}>
                <div><b>Fusion Small:</b> £100k - £3m</div>
                <div><b>Fusion Medium:</b> £3m - £10m</div>
                <div><b>Fusion Large:</b> £10m+</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="p-4">
          <h5>Email This Quote</h5>
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Client Name</label>
                <input type="text" className="form-control" placeholder="e.g. Jane Doe" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Contact Number</label>
                <input type="tel" className="form-control" placeholder="e.g. 07123456789" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="field">
                <label className="form-label">Client Email</label>
                <input type="email" className="form-control" placeholder="e.g. jane.doe@example.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12" style={{ alignSelf: "end" }}>
              <div className="field">
                <label className="form-label d-lg-block d-none">&nbsp;</label>
                <button onClick={handleSendToZapier} className="btn btn-primary w-100" disabled={sending || !calculation}>
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>

          {/* NEW: inline validation message (Bootstrap alert) */}
         {validationError && (
  <div style={{ marginTop: "16px", color: "#b91c1c", fontWeight: "50-0", textAlign: "center" }}>
    {validationError}
  </div>
)}


          {emailStatus === "success" && (
            <div className="alert alert-success mt-4" role="alert">
              Email sent successfully!
            </div>
          )}
          {emailStatus === "error" && (
            <div className="alert alert-danger mt-4" role="alert">
              Failed to send email. Please try again later.
            </div>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="p-4">
          <h5>Summary</h5>
          {calculation ? (
            <div className="summary-table">
              <div className="summary-header label-header" style={{ gridColumn: '1 / -1', background: headerColors[calculation.productColor] || '#3001ffff', justifyContent: 'center' }}>
                {calculation.productName}
              </div>
              {[
                { label: 'Full Rate', key: 'fullRate', format: (val) => `${fmtPct(calculation.couponRate)} + BBR` },
                { label: 'Pay Rate', key: 'payRate', format: (val) => `${fmtPct(calculation.couponRate - calculation.deferredRate)} + BBR` },
                { label: 'Gross Loan', key: 'grossLoan', format: fmtMoney0 },
                { label: 'Net Loan', key: 'netLoan', format: fmtMoney0 },
                { label: 'LTV (Loan to Value)', key: 'ltv', format: fmtPct },
                { label: 'Arrangement Fee', key: 'arrangementFee', format: (val) => `${fmtMoney0(val)} (${fmtPct(ARRANGEMENT_FEE_PCT)})` },
                { label: 'Term', key: 'term' },
                { label: 'Service Months', key: 'serviceMonths' },
                { label: 'Rolled Cost', key: 'rolledCost', format: fmtMoney0 },
                { label: 'Deferred Cost', key: 'deferredCost', format: fmtMoney0 },
                { label: 'Total Interest', key: 'totalInterest', format: fmtMoney0 },
                { label: 'Monthly Direct Debit', key: 'monthlyDirectDebit', format: (val) => `${fmtMoney0(val)} from month ${calculation.rm + 1}` },
                { label: 'ERC', key: 'erc' },
                { label: 'Max Product LTV', key: 'maxProductLtv', format: fmtPct },
              ].map(({ label, key, format }) => (
                <React.Fragment key={key}>
                  <div className="summary-cell label-cell">{label}</div>
                  <div className="summary-cell value-cell" style={{ justifyContent: 'center' }}>
                    {format ? format(calculation[key]) : calculation[key]}
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="alert alert-warning text-center">
              {errorMessage || "Please enter the loan details to see a summary."}
            </div>
          )}
        </div>
        <div className="text-center text-muted">
          <div className="mb-2">
            <b>BBR (Bank of England Base Rate)</b> is currently <b>{fmtPct(BBR)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("calc-root")).render(<App />);
