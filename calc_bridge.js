// Helper function to format currency without decimal places
const fmtMoney0 = (value) => {
  if (isNaN(value) || value === null) return "£0";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format percentages
const fmtPct = (value) => {
  if (isNaN(value) || value === null) return "0.00%";
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper function to safely parse a string to an integer
const parseIntSafe = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Component to render a section title with the requested formatting
const SectionTitle = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-full">
    <div className="md:col-span-2 lg:col-span-4 mt-4">
      <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider mb-2">
        {children}
      </h2>
      <hr className="border-t border-gray-300 mb-4" />
    </div>
  </div>
);

// Component for a styled input field, now with a placeholder prop
const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  disabled = false,
  helperText,
  placeholder,
}) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-700 font-semibold mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-200"
    />
    {helperText && (
      <div className="bg-gray-50 rounded-md p-2 mt-2 text-xs text-gray-600">
        {helperText}
      </div>
    )}
  </div>
);

// Component for a styled select field, now with optional helper text
const SelectField = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  helperText,
}) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-700 font-semibold mb-1">{label}</label>
    <select
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-200"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {helperText && (
      <div className="bg-gray-50 rounded-md p-2 mt-2 text-xs text-gray-600">
        {helperText}
      </div>
    )}
  </div>
);
const PillHeader = ({ children, className = "" }) => (
  <div
    className={
      "text-white text-sm font-semibold tracking-wide uppercase text-center py-3 rounded-t-xl " +
      className
    }
  >
    {children}
  </div>
);

// A single row with 3 cells: Label | Fixed | Variable
const ResultRow = ({ label, fixed, variable }) => (
  <div className="grid grid-cols-[1fr,1fr,1fr] gap-2 px-2">
    <div className="m-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium flex items-center">
      {label}
    </div>
    <div className="m-1 px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm font-semibold text-center">
      {fixed}
    </div>
    <div className="m-1 px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm font-semibold text-center">
      {variable}
    </div>
  </div>
);
// The main application component for the Bridging Calculator.
function App() {
  const { useState, useMemo, useEffect } = React;

  // Define state variables for user inputs.
  const [loanAmount, setLoanAmount] = useState(200000);
  const [propertyValue, setPropertyValue] = useState(400000);
  const [loanTerm, setLoanTerm] = useState(window.MIN_TERM_MONTHS_Bridges);
  const [rolledMonths, setRolledMonths] = useState(0);
  const [propertyType, setPropertyType] = useState("Residential");
  const [chargeType, setChargeType] = useState("First Charge");
  const [useSpecificNetLoan, setUseSpecificNetLoan] = useState("No");
  const [specificNetLoan, setSpecificNetLoan] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loanProduct, setLoanProduct] = useState(null);

  // Email fields
  const [clientName, setClientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success', 'error', or null

  // Helper to get loan product options
  const getLoanProductOptions = (propertyType, chargeType) => {
    if (chargeType === "Second Charge") {
      return ["2nd Charge Residential Only"];
    }
    const fixedRateProducts = Object.keys(window.RATES_Bridges["Fixed Rate"]);
    if (propertyType === "Residential") {
      return fixedRateProducts.filter(
        (key) =>
          ![
            "Semi & Commercial",
            "Semi & Commercial Large Loans",
            "2nd Charge Residential Only",
          ].includes(key)
      );
    } else {
      const commercialOrder = [
        "Semi & Commercial",
        "Semi & Commercial Large Loans",
        "BTL Portfolio Multi-Unit Dev Exit",
        "Permitted & Light Development",
      ];
      return fixedRateProducts
        .filter((key) => commercialOrder.includes(key))
        .sort(
          (a, b) => commercialOrder.indexOf(a) - commercialOrder.indexOf(b)
        );
    }
  };

  // Product options memo
  const loanProductOptions = useMemo(() => {
    return getLoanProductOptions(propertyType, chargeType);
  }, [propertyType, chargeType]);

  // Keep product valid
  useEffect(() => {
    if (loanProduct === null || !loanProductOptions.includes(loanProduct)) {
      setLoanProduct(loanProductOptions[0]);
    }
  }, [loanProductOptions, loanProduct]);

  // Force Residential when Second Charge
  useEffect(() => {
    if (chargeType === "Second Charge" && propertyType !== "Residential") {
      setPropertyType("Residential");
    }
  }, [chargeType, propertyType]);

  // Product limits (for helper display)
  // Product limits (for helper display)
  const productLimits = useMemo(() => {
    if (!loanProduct) return null;

    const loanSizeLimits = window.LOAN_SIZES_Bridges[loanProduct];
    const productRates = window.RATES_Bridges["Fixed Rate"][loanProduct];

    const ltvTiers = ["60% LTV", "70% LTV", "75% LTV"]; // ascending

    let minLTV = null;
    let maxLTV = null;

    for (const tier of ltvTiers) {
      if (productRates[tier] != null) {
        if (minLTV === null) minLTV = tier; // first supported tier encountered
        maxLTV = tier; // keep overwriting -> ends as highest supported
      }
    }

    return { loanSizeLimits, minLTV, maxLTV };
  }, [loanProduct]);

  // ---------- Back-calc helper: Specific Net -> Gross (tier-aware) ----------
  const backCalcGrossFromNet = (
    loanType,
    netLoan,
    rolled,
    value,
    loanProduct,
    arrangementFeeRate
  ) => {
    if (!(netLoan > 0) || !(value > 0)) return null;
    const productRates = window.RATES_Bridges?.[loanType]?.[loanProduct];
    if (!productRates) return null;

    const tiers = ["60% LTV", "70% LTV", "75% LTV"]; // ascending
    for (const label of tiers) {
      const coupon = productRates[label];
      if (coupon == null) continue;
      const monthly =
        loanType === "Variable Rate"
          ? coupon + window.STANDARD_BBR_Bridges / 12
          : coupon;
      const deduction = arrangementFeeRate + monthly * rolled;
      if (deduction >= 1) continue; // invalid inputs guard
      const gross = netLoan / (1 - deduction);
      const ltv = gross / value;
      const cap = parseInt(label, 10) / 100;
      if (ltv <= cap + 1e-10) return { gross, ltv, monthly };
    }
    return null;
  };

  // ---------- Main calculations ----------
  const calculationResults = useMemo(() => {
    // Per-loan-type forward calc (assumes gross & ltv known)
    const performCalculation = (loanType, commonData) => {
      const { grossLoan, term, rolled, ltv, arrangementFee, specificNetLoan } =
        commonData;
      if (
        !loanProduct ||
        !window.RATES_Bridges[loanType] ||
        !window.RATES_Bridges[loanType][loanProduct]
      ) {
        return { calculationError: "Please select a valid loan product." };
      }

      const ltvTiers = ["60% LTV", "70% LTV", "75% LTV"]; // ascending
      let couponRate = null;
      let supported = false;
      for (const tier of ltvTiers) {
        const tierCap = parseInt(tier, 10) / 100;
        if (ltv <= tierCap) {
          const productRates = window.RATES_Bridges[loanType][loanProduct];
          couponRate = productRates[tier];
          if (couponRate !== null) {
            supported = true;
            break;
          }
        }
      }
      if (!supported) {
        return {
          calculationError: "LTV is too high for this product.",
          couponMonthlyRate: null,
          fullMonthlyRate: null,
          totalInterest: null,
          rolledInterest: null,
          monthlyDirectDebit: null,
          totalRepayment: null,
          netLoan: null,
          servicedMonths: null,
        };
      }

      const fullMonthlyRate =
        loanType === "Variable Rate"
          ? couponRate + window.STANDARD_BBR_Bridges / 12
          : couponRate;
      const totalInterest = grossLoan * fullMonthlyRate * term;
      const rolledInterest = grossLoan * fullMonthlyRate * rolled;
      const servicedMonths = Math.max(0, term - rolled);
      const monthlyDirectDebit =
        servicedMonths > 0 ? grossLoan * fullMonthlyRate : 0;
      const totalRepayment = grossLoan + totalInterest;
      const netLoan =
        specificNetLoan !== null
          ? specificNetLoan
          : grossLoan - arrangementFee - rolledInterest;

      return {
        calculationError: null,
        couponMonthlyRate: couponRate,
        fullMonthlyRate,
        totalInterest,
        rolledInterest,
        monthlyDirectDebit,
        totalRepayment,
        netLoan,
        servicedMonths,
      };
    };

    // --- Inputs & validation ---
    const value = parseFloat(propertyValue);
    const term = parseIntSafe(loanTerm);
    const rolled = parseIntSafe(rolledMonths);

    if (!(value > 0) || !(term > 0) || isNaN(rolled) || rolled < 0) {
      setIsValid(false);
      setErrorMessage("Please enter valid positive numbers for all fields.");
      return null;
    }
    if (rolled > term) {
      setIsValid(false);
      setErrorMessage("Rolled months cannot be greater than the loan term.");
      return null;
    }
    if (chargeType === "Second Charge" && propertyType !== "Residential") {
      setIsValid(false);
      setErrorMessage(
        "Second charges are only available for Residential properties."
      );
      return null;
    }
    if (!loanProduct) {
      setIsValid(false);
      setErrorMessage("Please select a valid loan product.");
      return null;
    }

    const arrangementFeeRate = window.ARRANGEMENT_FEE_Bridges;

    // --- Establish gross & ltv for Fixed and Variable ---
    let grossLoanFixed, ltvFixed, grossLoanVariable, ltvVariable;
    let specificNetLoanValue = null;

    if (useSpecificNetLoan === "Yes") {
      specificNetLoanValue = parseFloat(specificNetLoan);
      if (!(specificNetLoanValue > 0)) {
        setIsValid(false);
        setErrorMessage(
          "Please enter a valid positive number for Specific Net Loan."
        );
        return null;
      }

      const backFix = backCalcGrossFromNet(
        "Fixed Rate",
        specificNetLoanValue,
        rolled,
        value,
        loanProduct,
        arrangementFeeRate
      );
      const backVar = backCalcGrossFromNet(
        "Variable Rate",
        specificNetLoanValue,
        rolled,
        value,
        loanProduct,
        arrangementFeeRate
      );
      if (!backFix || !backVar) {
        setIsValid(false);
        setErrorMessage(
          "Net loan and property value combination results in LTV that is too high for this product. Please adjust the values."
        );
        return null;
      }
      grossLoanFixed = backFix.gross;
      ltvFixed = backFix.ltv;
      grossLoanVariable = backVar.gross;
      ltvVariable = backVar.ltv;
    } else {
      grossLoanFixed = parseFloat(loanAmount);
      grossLoanVariable = parseFloat(loanAmount);
      ltvFixed = grossLoanFixed / value;
      ltvVariable = grossLoanVariable / value;
      if (!(grossLoanFixed > 0) || !(grossLoanVariable > 0)) {
        setIsValid(false);
        setErrorMessage("Please enter a valid positive number for Gross Loan.");
        return null;
      }
    }

    // Size & term checks
    const limits = window.LOAN_SIZES_Bridges[loanProduct];
    if (
      !limits ||
      grossLoanFixed < limits.min ||
      grossLoanFixed > limits.max ||
      grossLoanVariable < limits.min ||
      grossLoanVariable > limits.max
    ) {
      setIsValid(false);
      setErrorMessage(
        `Gross Loan must be between £${limits?.min.toLocaleString()} and £${limits?.max.toLocaleString()} for this product.`
      );
      return null;
    }
    if (
      term < window.MIN_TERM_MONTHS_Bridges ||
      term > window.MAX_TERM_MONTHS_Bridges
    ) {
      setIsValid(false);
      setErrorMessage(
        `Loan term must be between ${window.MIN_TERM_MONTHS_Bridges} and ${window.MAX_TERM_MONTHS_Bridges} months.`
      );
      return null;
    }

    // Fees
    const arrangementFeeFixed = grossLoanFixed * arrangementFeeRate;
    const arrangementFeeVariable = grossLoanVariable * arrangementFeeRate;

    // Forward calcs
    const fixedResults = performCalculation("Fixed Rate", {
      grossLoan: grossLoanFixed,
      ltv: ltvFixed,
      arrangementFee: arrangementFeeFixed,
      term,
      rolled,
      specificNetLoan:
        useSpecificNetLoan === "Yes" ? specificNetLoanValue : null,
    });
    const variableResults = performCalculation("Variable Rate", {
      grossLoan: grossLoanVariable,
      ltv: ltvVariable,
      arrangementFee: arrangementFeeVariable,
      term,
      rolled,
      specificNetLoan:
        useSpecificNetLoan === "Yes" ? specificNetLoanValue : null,
    });

    const mainErrorMessage =
      fixedResults.calculationError || variableResults.calculationError || "";
    if (mainErrorMessage) {
      setIsValid(false);
      setErrorMessage(mainErrorMessage);
      return null;
    }
    setIsValid(true);
    setErrorMessage("");

    // Return with ltv/arrangementFee/grossLoan INSIDE fixed/variable
    return {
      fixed: {
        ...fixedResults,
        ltv: ltvFixed,
        arrangementFee: arrangementFeeFixed,
        grossLoan: grossLoanFixed,
      },
      variable: {
        ...variableResults,
        ltv: ltvVariable,
        arrangementFee: arrangementFeeVariable,
        grossLoan: grossLoanVariable,
      },
      // keep these to show in the disabled Gross Loan box when using net mode
      fixedGrossLoan: grossLoanFixed,
      variableGrossLoan: grossLoanVariable,
    };
  }, [
    loanAmount,
    propertyValue,
    loanTerm,
    rolledMonths,
    propertyType,
    chargeType,
    loanProduct,
    useSpecificNetLoan,
    specificNetLoan,
  ]);

  const displayResults =
    calculationResults &&
    (isValid ||
      (calculationResults.fixed && calculationResults.fixed.calculationError) ||
      (calculationResults.variable &&
        calculationResults.variable.calculationError));

  // Options for selects
  const loanTermOptions = useMemo(() => {
    const options = [];
    for (
      let i = window.MIN_TERM_MONTHS_Bridges;
      i <= window.MAX_TERM_MONTHS_Bridges;
      i++
    )
      options.push(i);
    return options;
  }, []);
  const rolledMonthsOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i <= loanTerm; i++) options.push(i);
    return options;
  }, [loanTerm]);

  // Email handler
  const handleEmail = async () => {
    if (!calculationResults || !isValid) {
      alert("Please ensure all inputs are valid before sending the email.");
      return;
    }
    if (!clientName || !emailAddress) {
      alert("Please fill in all client details before sending the email.");
      return;
    }

    const emailData = {
      clientName,
      contactNumber,
      emailAddress,
      chargeType,
      propertyType,
      loanProduct,
      propertyValue: propertyValue,
      loanAmount:
        useSpecificNetLoan === "Yes"
          ? calculationResults.fixedGrossLoan
          : loanAmount,
      loanTerm,
      rolledMonths,
      fixedResults: calculationResults.fixed,
      variableResults: calculationResults.variable,
      arrangementFeeRate: window.ARRANGEMENT_FEE_Bridges,
      standardBBR: window.STANDARD_BBR_Bridges,
    };

    setIsSending(true);
    setSendStatus(null);
    try {
      const response = await fetch("send-email.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });
      setSendStatus(response.ok ? "success" : "error");
      if (!response.ok)
        console.error("Email sending failed with status:", response.status);
    } catch (err) {
      setSendStatus("error");
      console.error("Error sending email:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (loanProduct === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Loading calculator...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-8 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Bridging Calculator
          </h1>
          <p className="text-sm text-gray-600">
            A tool for estimating bridging loan costs.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          <SectionTitle>Loan Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SelectField
              label="Charge Type"
              value={chargeType}
              onChange={(e) => setChargeType(e.target.value)}
              options={["First Charge", "Second Charge"]}
              helperText={"Second charge is only available for Residential."}
            />
            <SelectField
              label="Property Type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              options={["Residential", "Commercial & Semi Commercial"]}
              disabled={chargeType === "Second Charge"}
            />
            <div>
              <SelectField
                label="Sub Product Type"
                value={loanProduct}
                onChange={(e) => setLoanProduct(e.target.value)}
                options={loanProductOptions}
              />
              {productLimits && (
                <div className="bg-gray-50 rounded-md p-2 mt-2 flex justify-between text-xs text-gray-600">
                  <div className="flex-1 text-center">
                    <span className="font-semibold block">Min Loan:</span>
                    {fmtMoney0(productLimits.loanSizeLimits?.min)}
                  </div>
                  <div className="flex-1 text-center">
                    <span className="font-semibold block">Max Loan:</span>
                    {fmtMoney0(productLimits.loanSizeLimits?.max)}
                  </div>
                  <div className="flex-1 text-center">
                    <span className="font-semibold block">Max LTV:</span>
                    {productLimits.maxLTV ?? "N/A"}
                    {/* If you want to show the range, use:
        <span>{productLimits.minLTV ?? "N/A"} – {productLimits.maxLTV ?? "N/A"}</span>
      */}
                  </div>
                </div>
              )}
            </div>
          </div>

          <SectionTitle>Financial Inputs</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField
              label="Gross Loan (£)"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              disabled={useSpecificNetLoan === "Yes"}
              placeholder={
                useSpecificNetLoan === "Yes"
                  ? "Calculated automatically"
                  : "e.g. 250000"
              }
            />

            <InputField
              label="Property Value (£)"
              value={propertyValue}
              onChange={(e) => setPropertyValue(e.target.value)}
            />
            <SelectField
              label="Use Specific Net Loan?"
              value={useSpecificNetLoan}
              onChange={(e) => setUseSpecificNetLoan(e.target.value)}
              options={["No", "Yes"]}
            />

            <InputField
              label="Specific Net Loan (£)"
              value={specificNetLoan}
              onChange={(e) => setSpecificNetLoan(e.target.value)}
              disabled={useSpecificNetLoan === "No"}
            />

            <SelectField
              label="Loan Term (months)"
              value={loanTerm}
              onChange={(e) => setLoanTerm(parseInt(e.target.value))}
              options={loanTermOptions}
              helperText={`Min: ${window.MIN_TERM_MONTHS_Bridges} months, Max: ${window.MAX_TERM_MONTHS_Bridges} months.`}
            />
            <SelectField
              label="Rolled Months"
              value={rolledMonths}
              onChange={(e) => setRolledMonths(parseInt(e.target.value))}
              options={rolledMonthsOptions}
              helperText={`Number of months of interest to be rolled into the loan.`}
            />
          </div>
        </div>

        {/* Email this Quote */}
        <div className="space-y-6">
          <SectionTitle>Email this Quote</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <InputField
              label="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              type="text"
              placeholder="e.g., John Smith"
            />
            <InputField
              label="Contact Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              type="text"
              placeholder="e.g., 07123 456789"
            />
            <InputField
              label="Email Address"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              type="email"
              placeholder="e.g., john.smith@example.com"
            />
            <div className="flex justify-start lg:justify-end mt-4 lg:mt-0">
              <button
                onClick={handleEmail}
                disabled={isSending}
                className={`flex items-center space-x-2 px-6 py-3 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 ${
                  isSending
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
              >
                {isSending && (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                <span>{isSending ? "Sending..." : "Send via Email"}</span>
              </button>
            </div>
          </div>
          {sendStatus === "success" && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Email sent successfully!
            </div>
          )}
          {sendStatus === "error" && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              Failed to send email. Please try again later.
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="mt-12">
          <SectionTitle>Summary of Results</SectionTitle>

          {!isValid && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p>{errorMessage}</p>
            </div>
          )}

          {displayResults && (
            <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-white">
              {/* Header row: empty label column + two product pill headers */}
              <div className="grid grid-cols-[1fr,1fr,1fr]">
                <div className="bg-white" />
                <PillHeader className="bg-emerald-600">Fixed Bridge</PillHeader>
                <PillHeader className="bg-sky-600">Variable Bridge</PillHeader>
              </div>

              {/* Content rows */}
              <div className="py-2">
                <ResultRow
                  label="Coupon Monthly Rate"
                  fixed={
                    calculationResults.fixed.couponMonthlyRate != null
                      ? fmtPct(calculationResults.fixed.couponMonthlyRate)
                      : "N/A"
                  }
                  variable={
                    calculationResults.variable.couponMonthlyRate != null
                      ? fmtPct(calculationResults.variable.couponMonthlyRate)
                      : "N/A"
                  }
                />
                <ResultRow
                  label="Full Monthly Rate"
                  fixed={
                    calculationResults.fixed.fullMonthlyRate != null
                      ? fmtPct(calculationResults.fixed.fullMonthlyRate)
                      : "N/A"
                  }
                  variable={
                    calculationResults.variable.fullMonthlyRate != null
                      ? fmtPct(calculationResults.variable.fullMonthlyRate)
                      : "N/A"
                  }
                />
                <ResultRow
                  label="Gross Loan"
                  fixed={fmtMoney0(calculationResults.fixed.grossLoan)}
                  variable={fmtMoney0(calculationResults.variable.grossLoan)}
                />
                <ResultRow
                  label="Net Loan"
                  fixed={
                    calculationResults.fixed.netLoan != null
                      ? fmtMoney0(calculationResults.fixed.netLoan)
                      : "N/A"
                  }
                  variable={
                    calculationResults.variable.netLoan != null
                      ? fmtMoney0(calculationResults.variable.netLoan)
                      : "N/A"
                  }
                />
                <ResultRow
                  label="Current LTV"
                  fixed={fmtPct(calculationResults.fixed.ltv)}
                  variable={fmtPct(calculationResults.variable.ltv)}
                />
                <ResultRow
                  label="Arrangement Fee"
                  fixed={`${fmtMoney0(
                    calculationResults.fixed.arrangementFee
                  )} (${fmtPct(window.ARRANGEMENT_FEE_Bridges)})`}
                  variable={`${fmtMoney0(
                    calculationResults.variable.arrangementFee
                  )} (${fmtPct(window.ARRANGEMENT_FEE_Bridges)})`}
                />
                <ResultRow
                  label="Serviced Months"
                  fixed={calculationResults.fixed.servicedMonths}
                  variable={calculationResults.variable.servicedMonths}
                />
                <ResultRow
                  label="Total Interest"
                  fixed={
                    calculationResults.fixed.totalInterest != null
                      ? fmtMoney0(calculationResults.fixed.totalInterest)
                      : "N/A"
                  }
                  variable={
                    calculationResults.variable.totalInterest != null
                      ? fmtMoney0(calculationResults.variable.totalInterest)
                      : "N/A"
                  }
                />
                <ResultRow
                  label="Rolled Interest"
                  fixed={
                    calculationResults.fixed.rolledInterest != null
                      ? fmtMoney0(calculationResults.fixed.rolledInterest)
                      : "N/A"
                  }
                  variable={
                    calculationResults.variable.rolledInterest != null
                      ? fmtMoney0(calculationResults.variable.rolledInterest)
                      : "N/A"
                  }
                />
                <ResultRow
                  label="Monthly Direct Debit"
                  fixed={
                    calculationResults.fixed.monthlyDirectDebit != null
                      ? fmtMoney0(calculationResults.fixed.monthlyDirectDebit)
                      : "N/A"
                  }
                  variable={
                    calculationResults.variable.monthlyDirectDebit != null
                      ? fmtMoney0(
                          calculationResults.variable.monthlyDirectDebit
                        )
                      : "N/A"
                  }
                />
                <ResultRow
                  label="Total Repayment"
                  fixed={
                    calculationResults.fixed.totalRepayment != null
                      ? fmtMoney0(calculationResults.fixed.totalRepayment)
                      : "N/A"
                  }
                  variable={
                    calculationResults.variable.totalRepayment != null
                      ? fmtMoney0(calculationResults.variable.totalRepayment)
                      : "N/A"
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Render the App component to the DOM (for browser usage)
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
