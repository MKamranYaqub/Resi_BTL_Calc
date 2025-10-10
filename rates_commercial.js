// --- Commercial Property Rates ---
window.RATES_Commercial = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0629, 4: 0.0719, 2: 0.0829 },
      "3yr Fix": { 6: 0.0679, 4: 0.0749, 2: 0.0819 },
      "2yr Tracker": {
        6: 0.0304,
        4: 0.0404,
        2: 0.0499,
        isMargin: true,
      },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0679, 4: 0.0769, 2: 0.0879 },
      "3yr Fix": { 6: 0.0729, 4: 0.0799, 2: 0.0869 },
      "2yr Tracker": {
        6: 0.0334,
        4: 0.0434,
        2: 0.0529,
        isMargin: true,
      },
    },
  },
};

// --- Semi-Commercial Property Rates ---
window.RATES_SemiCommercial = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0619, 4: 0.0709, 2: 0.0819 },
      "3yr Fix": { 6: 0.0669, 4: 0.0739, 2: 0.0809 },
      "2yr Tracker": {
        6: 0.0304,
        4: 0.0404,
        2: 0.0499,
        isMargin: true,
      },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0659, 4: 0.0749, 2: 0.0859 },
      "3yr Fix": { 6: 0.0709, 4: 0.0779, 2: 0.0849 },
      "2yr Tracker": {
        6: 0.0334,
        4: 0.0434,
        2: 0.0529,
        isMargin: true,
      },
    },
  },
};

window.PRODUCT_TYPES_Commercial = ["2yr Fix", "3yr Fix", "2yr Tracker"];
window.PRODUCT_TYPES_SemiCommercial = ["2yr Fix", "3yr Fix", "2yr Tracker"];

// --- Additional criteria constants ---
window.MIN_ICR_Commercial = {
  Fix: 1.25,
  Tracker: 1.3,
};

window.MIN_ICR_SemiCommercial = {
  Fix: 1.25,
  Tracker: 1.3,
};

// --- Loan limits ---
window.MIN_LOAN_Commercial = 150000;
window.MAX_LOAN_Commercial = 2000000;
window.MIN_LOAN_SemiCommercial = 150000;
window.MAX_LOAN_SemiCommercial = 2000000;

// --- Base BBR values ---
window.STANDARD_BBR_Commercial = 0.04;
window.STRESS_BBR_Commercial = 0.0425;
window.STANDARD_BBR_SemiCommercial = 0.04;
window.STRESS_BBR_SemiCommercial = 0.0425;


// --- Product terms (in months) ---
window.TERM_MONTHS_Commercial = {
  "2yr Fix": 24,
  "3yr Fix": 36,
  "2yr Tracker": 24,
};

// --- Revert Rate (Commercial) ---
window.REVERT_RATE_Commercial = {
  "Tier 1": { add: 0.003 },
  "Tier 2": { add: 0.015 },
};

// --- Revert Rate (Semi-Commercial) ---
window.REVERT_RATE_SemiCommercial = {
  "Tier 1": { add: 0.003 },
  "Tier 2": { add: 0.015 },
};

// --- Total term (in years) ---
window.TOTAL_TERM_Commercial = 10;

// --- ERC structure ---
window.ERC_Commercial = {
  "2yr Fix": ["4%", "3%", "then no ERC"],
  "3yr Fix": ["4%", "3%", "2%", "then no ERC"],
  "2yr Tracker": ["4%", "3%", "then no ERC"],
};

// --- Lead destination ---
window.LEAD_TO_Commercial = "leads@example.com";

// --- Current MVR ---
window.CURRENT_MVR_Commercial = 0.0859;
