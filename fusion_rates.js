// fusion_rates.js

// This file contains all the rates, criteria, and constants for the Fusion Calculator.
// By keeping this data separate, it's easy to update rates without touching the main calculator logic.

// Bank of England Base Rate (BBR)
window.FUSION_BBR = 0.04; // Currently 4.00%

// Arrangement Fee Percentage
window.FUSION_ARRANGEMENT_FEE_PCT = 0.02; // 2.00%

// Product Term
window.FUSION_TERM_MONTHS = 24;

// LTV (Loan to Value) Caps by Property Type
window.FUSION_LTV_CAPS = {
  Residential: 0.75, // 75%
  "Semi / Full Commercial": 0.70, // 70%
};

// NEW Product Structure with Loan Size Bands
window.FUSION_PRODUCTS = {
  Residential: {
    Standard: {
      rate: 0.0479,
      minLoan: 100000,
      maxLoan: 3000000,
    },
    Large: {
      rate: 0.0599,
      minLoan: 3000001,
      maxLoan: 20000000,
    },
    
  },
  "Semi / Full Commercial": {
    Standard: {
      rate: 0.0529,
      minLoan: 100000,
      maxLoan: 3000000,
    },
    
    Large: {
      rate: 0.0649,
      minLoan: 3000001,
      maxLoan: 20000000,
    },
  },
};

// Early Repayment Charge (ERC) Details
window.FUSION_ERC = "Yr1 6% | Yr2 3% (25% ERC free after 6m, no ERC after 21m)";


// EmailJS Configuration
window.EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
window.EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
window.EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
window.LEAD_TO_EMAIL = "leads@example.com";
