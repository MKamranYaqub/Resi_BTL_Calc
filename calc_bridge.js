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
      <h2 className="text-sm font-bold uppercase text-gray-700 tracking-wider mb-2">{children}</h2>
      <hr className="border-t border-gray-300 mb-4" />
    </div>
  </div>
);

// Component for a styled input field
const InputField = ({ label, value, onChange, type = "number", min, max, disabled = false, helperText }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-700 font-semibold mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      disabled={disabled}
      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-200"
    />
    {helperText && (
      <div className="bg-gray-100 rounded-md p-2 mt-2 text-xs text-gray-600">
        {helperText}
      </div>
    )}
  </div>
);

// Component for a styled select field, now with optional helper text
const SelectField = ({ label, value, onChange, options, disabled = false, helperText }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-700 font-semibold mb-1">{label}</label>
    <select
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-200"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {helperText && (
      <div className="bg-gray-100 rounded-md p-2 mt-2 text-xs text-gray-600">
        {helperText}
      </div>
    )}
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
  const [specificNetLoan, setSpecificNetLoan] = useState(250000);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loanProduct, setLoanProduct] = useState(null);

  // Helper function to get loan product options based on property and charge type.
  const getLoanProductOptions = (propertyType, chargeType) => {
    // If the charge type is "Second Charge", this is the only option.
    if (chargeType === "Second Charge") {
      return ["2nd Charge Residential Only"];
    }

    const fixedRateProducts = Object.keys(window.RATES_Bridges["Fixed Rate"]);

    // If the charge type is "First Charge" and property is "Residential"
    if (propertyType === "Residential") {
      return fixedRateProducts.filter(
        (key) => !["Semi & Commercial", "Semi & Commercial Large Loans", "BTL Portfolio Multi-Unit Dev Exit", "2nd Charge Residential Only"].includes(key)
      );
    } 
    // If the charge type is "First Charge" and property is "Commercial"
    else {
      // Custom order for Commercial products
      const commercialOrder = [
        "Semi & Commercial",
        "Semi & Commercial Large Loans",
        "BTL Portfolio Multi-Unit Dev Exit",
        "Permitted & Light Development",
      ];
      return fixedRateProducts.filter(
        (key) => commercialOrder.includes(key)
      ).sort((a, b) => commercialOrder.indexOf(a) - commercialOrder.indexOf(b));
    }
  };

  // Memoize the product options based on Property Type and Charge Type.
  const loanProductOptions = useMemo(() => {
    return getLoanProductOptions(propertyType, chargeType);
  }, [propertyType, chargeType]);

  // Use a single useEffect to manage the loanProduct state.
  useEffect(() => {
    if (loanProduct === null || !loanProductOptions.includes(loanProduct)) {
      setLoanProduct(loanProductOptions[0]);
    }
  }, [loanProductOptions, loanProduct]);

  // Effect to handle the auto-selection of "Residential" for "Second Charge"
  useEffect(() => {
    if (chargeType === "Second Charge" && propertyType !== "Residential") {
      setPropertyType("Residential");
    }
  }, [chargeType, propertyType]);
  
  // Memoized hook to get product-specific limits
  const productLimits = useMemo(() => {
    if (!loanProduct) return null;

    const loanSizeLimits = window.LOAN_SIZES_Bridges[loanProduct];
    let maxLTV = null;
    const ltvTiers = ["75% LTV", "70% LTV", "60% LTV"];
    const productRates = window.RATES_Bridges["Fixed Rate"][loanProduct];
    for (const tier of ltvTiers) {
      if (productRates[tier] !== null) {
        maxLTV = tier;
        break;
      }
    }
    return { loanSizeLimits, maxLTV };
  }, [loanProduct]);

  // This useMemo hook now calculates results for BOTH fixed and variable rates.
  const calculationResults = useMemo(() => {
    // This inner function performs the calculation for a specific loan type.
    const performCalculation = (loanType, commonData) => {
      const { grossLoan, term, rolled, ltv, arrangementFee, specificNetLoan } = commonData;

      if (!loanProduct || !window.RATES_Bridges[loanType] || !window.RATES_Bridges[loanType][loanProduct]) {
        return { error: "Please select a valid loan product." };
      }

      const ltvTiers = ["60% LTV", "70% LTV", "75% LTV"];
      let couponRate = null;
      let isLTVSupported = false;
      for (const tier of ltvTiers) {
        const tierLTV = parseInt(tier.replace('% LTV', ''), 10) / 100;
        if (ltv <= tierLTV) {
          const productRates = window.RATES_Bridges[loanType][loanProduct];
          couponRate = productRates[tier];
          if (couponRate !== null) {
            isLTVSupported = true;
            break;
          }
        }
      }

      if (!isLTVSupported) {
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

      const fullMonthlyRate = loanType === "Variable Rate" ? (couponRate + (window.STANDARD_BBR_Bridges / 12)) : couponRate;
      const totalInterest = grossLoan * fullMonthlyRate * term;
      const rolledInterest = grossLoan * fullMonthlyRate * rolled;
      const monthlyDirectDebit = (term - rolled) > 0 ? (grossLoan * fullMonthlyRate) : 0;
      const totalRepayment = grossLoan + totalInterest;
      
      const netLoan = specificNetLoan !== null ? specificNetLoan : (grossLoan - arrangementFee - rolledInterest);

      // Log the requested values to the console for debugging
      console.log(`--- ${loanType} Calculation ---`);
      console.log(`Full Monthly Rate: ${fullMonthlyRate}`);
      console.log(`Rolled Months: ${rolled}`);
      console.log(`Arrangement Fee: ${ARRANGEMENT_FEE_Bridges}`);
      console.log(`Calculated Net Loan: ${netLoan}`);
      console.log(`-----------------------------`);


      return {
        calculationError: null,
        couponMonthlyRate: couponRate,
        fullMonthlyRate: fullMonthlyRate,
        totalInterest: totalInterest,
        rolledInterest: rolledInterest,
        monthlyDirectDebit: monthlyDirectDebit,
        totalRepayment: totalRepayment,
        netLoan: netLoan,
        servicedMonths: term - rolled,
      };
    };

    // --- Main validation and common calculations ---
    const value = parseFloat(propertyValue);
    const term = parseIntSafe(loanTerm);
    const rolled = parseIntSafe(rolledMonths);

    // Basic input validation
    if (isNaN(value) || value <= 0 || isNaN(term) || term <= 0 || isNaN(rolled)) {
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
      setErrorMessage("Second charges are only available for Residential properties.");
      return null;
    }

    const arrangementFeeRate = window.ARRANGEMENT_FEE_Bridges;

    // Corrected formula for calculating the gross loan based on net loan
    const calculateGrossLoan = (loanType, netLoan, rolled) => {
        if (isNaN(netLoan) || netLoan <= 0) return null;

        const ltvTiers = ["60% LTV", "70% LTV", "75% LTV"];
        let couponRate = null;
        for (const tier of ltvTiers) {
            const productRates = window.RATES_Bridges[loanType][loanProduct];
            couponRate = productRates[tier];
            if (couponRate !== null) {
                break;
            }
        }
        
        if (couponRate === null) return null;
        const fullMonthlyRate = loanType === "Variable Rate" ? (couponRate + (window.STANDARD_BBR_Bridges / 12)) : couponRate;
        const fullMonthlyRolled = fullMonthlyRate * rolled;
        // This is the correct formula
        const deduction = arrangementFeeRate + (fullMonthlyRate * rolled);
return netLoan / (1 - deduction);
    };
    
    let grossLoanFixed;
    let grossLoanVariable;

    if (useSpecificNetLoan === "Yes") {
      grossLoanFixed = calculateGrossLoan("Fixed Rate", parseFloat(specificNetLoan), rolled);
      grossLoanVariable = calculateGrossLoan("Variable Rate", parseFloat(specificNetLoan), rolled);
    } else {
      grossLoanFixed = parseFloat(loanAmount);
      grossLoanVariable = parseFloat(loanAmount);
    }
    
    if (isNaN(grossLoanFixed) || grossLoanFixed <= 0 || isNaN(grossLoanVariable) || grossLoanVariable <= 0) {
        setIsValid(false);
        setErrorMessage("Please enter a valid positive number for Specific Net Loan.");
        return null;
    }
    
    if (!loanProduct) {
        setIsValid(false);
        setErrorMessage("Please select a valid loan product.");
        return null;
    }

    const loanSizeLimits = window.LOAN_SIZES_Bridges[loanProduct];
    if (!loanSizeLimits || grossLoanFixed < loanSizeLimits.min || grossLoanFixed > loanSizeLimits.max || grossLoanVariable < loanSizeLimits.min || grossLoanVariable > loanSizeLimits.max) {
      setIsValid(false);
      setErrorMessage(`Gross Loan must be between £${loanSizeLimits?.min.toLocaleString()} and £${loanSizeLimits?.max.toLocaleString()} for this product.`);
      return null;
    }

    if (term < window.MIN_TERM_MONTHS_Bridges || term > window.MAX_TERM_MONTHS_Bridges) {
      setIsValid(false);
      setErrorMessage(`Loan term must be between ${window.MIN_TERM_MONTHS_Bridges} and ${window.MAX_TERM_MONTHS_Bridges} months.`);
      return null;
    }

    // Now we perform the calculations for each product type with its specific gross loan
    const ltvFixed = (grossLoanFixed / value);
    const arrangementFeeFixed = grossLoanFixed * arrangementFeeRate;
    const ltvVariable = (grossLoanVariable / value);
    const arrangementFeeVariable = grossLoanVariable * arrangementFeeRate;

    const fixedResults = performCalculation("Fixed Rate", { grossLoan: grossLoanFixed, ltv: ltvFixed, arrangementFee: arrangementFeeFixed, term, rolled, specificNetLoan: useSpecificNetLoan === "Yes" ? parseFloat(specificNetLoan) : null });
    const variableResults = performCalculation("Variable Rate", { grossLoan: grossLoanVariable, ltv: ltvVariable, arrangementFee: arrangementFeeVariable, term, rolled, specificNetLoan: useSpecificNetLoan === "Yes" ? parseFloat(specificNetLoan) : null });
    
    let mainErrorMessage = "";
    if (fixedResults.calculationError) {
      mainErrorMessage = fixedResults.calculationError;
    } else if (variableResults.calculationError) {
      mainErrorMessage = variableResults.calculationError;
    }

    if (mainErrorMessage) {
      setIsValid(false);
      setErrorMessage(mainErrorMessage);
      return null;
    } else {
      setIsValid(true);
      setErrorMessage("");
    }

    return {
      fixed: { ...fixedResults, grossLoan: grossLoanFixed, ltv: ltvFixed, arrangementFee: arrangementFeeFixed },
      variable: { ...variableResults, grossLoan: grossLoanVariable, ltv: ltvVariable, arrangementFee: arrangementFeeVariable },
    };
  }, [loanAmount, propertyValue, loanTerm, rolledMonths, propertyType, chargeType, loanProduct, useSpecificNetLoan, specificNetLoan]);
  
  const displayResults = calculationResults && (isValid || (calculationResults.fixed && calculationResults.fixed.calculationError) || (calculationResults.variable && calculationResults.variable.calculationError));
  
  // Memoized arrays for dropdown options
  const loanTermOptions = useMemo(() => {
    const options = [];
    for (let i = window.MIN_TERM_MONTHS_Bridges; i <= window.MAX_TERM_MONTHS_Bridges; i++) {
      options.push(i);
    }
    return options;
  }, []);

  const rolledMonthsOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i <= loanTerm; i++) {
      options.push(i);
    }
    return options;
  }, [loanTerm]);

  if (loanProduct === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading calculator...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-8 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Bridging Calculator</h1>
          <p className="text-sm text-gray-600">A tool for estimating bridging loan costs.</p>
        </div>

        {/* Inputs Section */}
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
              {/* Product limits are now shown in a single row */}
              {productLimits && (
                <div className="bg-gray-100 rounded-md p-2 mt-2 flex justify-between text-xs text-gray-600">
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
                    {productLimits.maxLTV}
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
            {useSpecificNetLoan === 'Yes' && (
              <InputField
                label="Specific Net Loan (£)"
                value={specificNetLoan}
                onChange={(e) => setSpecificNetLoan(e.target.value)}
              />
            )}
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

        {/* Results Section */}
        <div className="mt-12">
          <SectionTitle>Summary of Results</SectionTitle>
          {!isValid && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p>{errorMessage}</p>
            </div>
          )}
          {displayResults && (
            <div className="grid grid-cols-3 gap-px text-center bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {/* Header Row */}
              <div className="p-4 font-bold text-gray-800 bg-gray-50 text-left"></div>
              <div className="p-4 font-bold text-gray-800 bg-sky-200">Fixed Bridge</div>
              <div className="p-4 font-bold text-gray-800 bg-emerald-200">Variable Bridge</div>
              
              {/* Data Rows */}
              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Coupon Monthly Rate</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.fixed.couponMonthlyRate !== null ? fmtPct(calculationResults.fixed.couponMonthlyRate) : "N/A"}</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.variable.couponMonthlyRate !== null ? fmtPct(calculationResults.variable.couponMonthlyRate) : "N/A"}</div>
              
              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Full Monthly Rate</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.fixed.fullMonthlyRate !== null ? fmtPct(calculationResults.fixed.fullMonthlyRate) : "N/A"}</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.variable.fullMonthlyRate !== null ? fmtPct(calculationResults.variable.fullMonthlyRate) : "N/A"}</div>

              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Gross Loan</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{fmtMoney0(calculationResults.fixed.grossLoan)}</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{fmtMoney0(calculationResults.variable.grossLoan)}</div>

              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Net Loan</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.fixed.netLoan !== null ? fmtMoney0(calculationResults.fixed.netLoan) : "N/A"}</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.variable.netLoan !== null ? fmtMoney0(calculationResults.variable.netLoan) : "N/A"}</div>

              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Current LTV</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{fmtPct(calculationResults.fixed.ltv)}</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{fmtPct(calculationResults.variable.ltv)}</div>
              
              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Arrangement Fee</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{fmtMoney0(calculationResults.fixed.arrangementFee)} ({fmtPct(window.ARRANGEMENT_FEE_Bridges)})</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{fmtMoney0(calculationResults.variable.arrangementFee)} ({fmtPct(window.ARRANGEMENT_FEE_Bridges)})</div>
              
              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Serviced Months</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.fixed.servicedMonths}</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.variable.servicedMonths}</div>

              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Total Interest</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.fixed.totalInterest !== null ? fmtMoney0(calculationResults.fixed.totalInterest) : "N/A"}</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.variable.totalInterest !== null ? fmtMoney0(calculationResults.variable.totalInterest) : "N/A"}</div>

              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Rolled Interest</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.fixed.rolledInterest !== null ? fmtMoney0(calculationResults.fixed.rolledInterest) : "N/A"}</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.variable.rolledInterest !== null ? fmtMoney0(calculationResults.variable.rolledInterest) : "N/A"}</div>

              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Monthly Direct Debit</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.fixed.monthlyDirectDebit !== null ? fmtMoney0(calculationResults.fixed.monthlyDirectDebit) : "N/A"}</div>
              <div className="p-4 font-bold text-gray-600 bg-white">{calculationResults.variable.monthlyDirectDebit !== null ? fmtMoney0(calculationResults.variable.monthlyDirectDebit) : "N/A"}</div>

              <div className="p-4 font-semibold text-gray-700 bg-white text-left">Total Repayment</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.fixed.totalRepayment !== null ? fmtMoney0(calculationResults.fixed.totalRepayment) : "N/A"}</div>
              <div className="p-4 font-bold text-gray-600 bg-gray-50">{calculationResults.variable.totalRepayment !== null ? fmtMoney0(calculationResults.variable.totalRepayment) : "N/A"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// Render the App component to the DOM (for browser usage)
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
