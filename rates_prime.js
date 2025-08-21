// --- Rates (string keys for 6/4/3/2 columns) ---
window.RATES_Prime = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0529, 4: 0.0619, 3: 0.0679, 2: 0.0729 },
      "3yr Fix": { 6: 0.0579, 4: 0.0649, 3: 0.0686, 2: 0.0719 },
      "2yr Tracker": {
        6: 0.0149,
        4: 0.0249,
        3: 0.0304,
        2: 0.0354,
        isMargin: true,
      },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0589, 4: 0.0679, 3: 0.0739, 2: 0.0789 },
      "3yr Fix": { 6: 0.0639, 4: 0.0709, 3: 0.0746, 2: 0.0779 },
      "2yr Tracker": {
        6: 0.0169,
        4: 0.0269,
        3: 0.0324,
        2: 0.0374,
        isMargin: true,
      },
    },
  },
};

window.PRODUCT_TYPES_Prime = ["2yr Fix", "3yr Fix", "2yr Tracker"];
window.FEE_COLS_Prime = ["6", "4", "3", "2"];

// --- Additional criteria constants ---
window.MIN_ICR_Prime = {
  Fix: 1.25,
  Tracker: 1.3,
};

// --- Loan limits ---
window.MIN_LOAN_Prime = 150000;
window.MAX_LOAN_Prime = 3000000;

// Base BBR values
window.STANDARD_BBR_Prime = 0.04;
window.STRESS_BBR_Prime = 0.0425;

// --- Product terms (in months) ---
window.TERM_MONTHS_Prime = {
  "2yr Fix": 24,
  "3yr Fix": 36,
  "2yr Tracker": 24,
};

// --- Revert rate offsets by Tier (decimals) ---
window.REVERT_RATE_Prime = {
  "Tier 1": { add: 0.0 }, // MVR
  "Tier 2": { add: 0.004 }, // MVR + 0.40%
};

// --- Total term (in years) ---
window.TOTAL_TERM_Prime = 25;

// --- ERC structure per product type ---
window.ERC_Prime = {
  "2yr Fix": ["4%", "3%", "then no ERC"],
  "3yr Fix": ["4%", "3%", "2%", "then no ERC"],
  "2yr Tracker": ["4%", "3%", "then no ERC"],
};

// Lead capture destination
window.LEAD_TO_Prime = "leads@example.com";

// ---- Current MVR -----//
window.CURRENT_MVR_Prime = 0.0859;

window.MIN_STRESS_RATE = 0.055; // New variable for min stress rate