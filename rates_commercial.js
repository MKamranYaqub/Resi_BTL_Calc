// --- Rates (string keys for 6/4/3/2 columns) ---
window.RATES_Commercial = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0589, 4: 0.0679, 3: 0.0739, 2: 0.0789 },
      "3yr Fix": { 6: 0.0639, 4: 0.0709, 3: 0.0746, 2: 0.0779 },
      "2yr Tracker": {
        6: 0.0159,
        4: 0.0259,
        3: 0.0314,
        2: 0.0364,
        isMargin: true,
      },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0639, 4: 0.0729, 3: 0.0789, 2: 0.0839 },
      "3yr Fix": { 6: 0.0689, 4: 0.0759, 3: 0.0796, 2: 0.0829 },
      "2yr Tracker": {
        6: 0.0209,
        4: 0.0309,
        3: 0.0364,
        2: 0.0414,
        isMargin: true,
      },
    },
  },
  "Tier 3": {
    products: {
      "2yr Fix": { 6: 0.0679, 4: 0.0769, 3: 0.0829, 2: 0.0879 },
      "3yr Fix": { 6: 0.0729, 4: 0.0799, 3: 0.0836, 2: 0.0869 },
      "2yr Tracker": {
        6: 0.0239,
        4: 0.0339,
        3: 0.0394,
        2: 0.0444,
        isMargin: true,
      },
    },
  },
};

window.PRODUCT_TYPES_Commercial = ["2yr Fix", "3yr Fix", "2yr Tracker"];
window.FEE_COLS_Commercial = ["6", "4", "3", "2"];

// --- Additional criteria constants ---
window.MIN_ICR_Commercial = {
  Fix: 1.25, // 125% minimum ICR
  Tracker: 1.3, // 130% minimum ICR
};

// --- Loan limits ---
window.MIN_LOAN_Commercial = 150000;
window.MAX_LOAN_Commercial = 2000000;

// Base BBR values
window.STANDARD_BBR_Commercial = 0.04; // 4.00% default (or pull from input if needed)
window.STRESS_BBR_Commercial = 0.0425; // 4.25% → always 0.25% higher than standard

// --- Product terms (in months) ---
window.TERM_MONTHS_Commercial = {
  "2yr Fix": 24,
  "3yr Fix": 36,
  "2yr Tracker": 24, // 2-year tracker = 24 months
};

// --- Revert rate offsets by Tier (decimals) ---
// Displayed as "MVR" or "MVR + X%"
window.REVERT_RATE_Commercial = {
  "Tier 1": { add: 0.003 }, // 
  "Tier 2": { add: 0.015 }, // 
  
};

// --- Total term (in years) ---
window.TOTAL_TERM_Commercial = 10; // always 10 years

// --- ERC structure per product type ---
window.ERC_Commercial = {
  "2yr Fix": ["4%", "3%", "then no ERC"], // Y1 = 4%, Y2 = 3%, then no ERC
  "3yr Fix": ["4%", "3%", "2%", "then no ERC"], // Y1 = 4%, Y2 = 3%, Y3 = 2%, then no ERC
  "2yr Tracker": ["4%", "3%", "then no ERC"], // No ERC
};

// Lead capture destination (change to your real inbox)
window.LEAD_TO_Commercial = "leads@example.com";

// ---- Current MVR -----//

// --- Total term (in years) ---
window.CURRENT_MVR_Commercial  = 0.0859; // always 10 years

