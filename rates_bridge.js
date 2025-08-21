/**
 * @fileoverview Rates sheet for the MFS Bridging Calculator.
 * This file contains all the rate, fee, loan size, and term data
 * for the calculator, structured as JavaScript objects and arrays.
 * * Data is derived from the "Simplified Product Names" rate sheet image.
 */

// Global constant for the maximum loan term in months.
window.MAX_TERM_MONTHS_Bridges = 18;

// Global constant for the minimum loan term in months.
window.MIN_TERM_MONTHS_Bridges = 3;

// Global constant for the arrangement fee percentage.
window.ARRANGEMENT_FEE_Bridges = 0.02; // 2%

// Global constant for the current BBR (Bank Base Rate).
// This is a variable that can be updated.
window.STANDARD_BBR_Bridges = 0.04; // 4%

// Data structure for the bridging loan rates.
// It is organized by product type (Fixed Rate or Variable Rate) and LTV.
window.RATES_Bridges = {
  "Variable Rate": {
    "Single Property": {
      "60% LTV": 0.0045,
      "70% LTV": 0.0055,
      "75% LTV": 0.0065,
    },
    "Large Single Property": {
      "60% LTV": 0.0055,
      "70% LTV": 0.0065,
      "75% LTV": 0.0075,
    },
    "BTL Portfolio Multi-Unit Dev Exit": {
      "60% LTV": 0.0050,
      "70% LTV": 0.0060,
      "75% LTV": 0.0070,
    },
    "Permitted & Light Development": {
      "60% LTV": 0.0050,
      "70% LTV": 0.0060,
      "75% LTV": 0.0070,
    },
    "Semi & Commercial": {
      "60% LTV": 0.0050,
      "70% LTV": 0.0060,
      "75% LTV": 0.0070,
    },
    "Semi & Commercial Large Loans": {
      "60% LTV": 0.0055,
      "70% LTV": 0.0065,
      "75% LTV": 0.0075,
    },
    "2nd Charge Residential Only": {
      "60% LTV": 0.0050,
      "70% LTV": 0.0060,
      "75% LTV": null, // Not applicable
    }
  },
  "Fixed Rate": {
    "Single Property": {
      "60% LTV": 0.0080,
      "70% LTV": 0.0090,
      "75% LTV": 0.0100,
    },
    "Large Single Property": {
      "60% LTV": 0.0090,
      "70% LTV": 0.0100,
      "75% LTV": 0.0110,
    },
    "BTL Portfolio Multi-Unit Dev Exit": {
      "60% LTV": 0.0085,
      "70% LTV": 0.0095,
      "75% LTV": 0.0105,
    },
    "Permitted & Light Development": {
      "60% LTV": 0.0085,
      "70% LTV": 0.0095,
      "75% LTV": 0.0105,
    },
    "Semi & Commercial": {
      "60% LTV": 0.0085,
      "70% LTV": 0.0095,
      "75% LTV": 0.0105,
    },
    "Semi & Commercial Large Loans": {
      "60% LTV": 0.0090,
      "70% LTV": 0.0100,
      "75% LTV": 0.0110,
    },
    "2nd Charge Residential Only": {
      "60% LTV": 0.0085,
      "70% LTV": 0.0095,
      "75% LTV": null, // Not applicable
    }
  }
};

// Data structure for loan size limits.
window.LOAN_SIZES_Bridges = {
  "Single Property": { min: 100000, max: 4000000 },
  "Large Single Property": { min: 4000001, max: 20000000 },
  "BTL Portfolio Multi-Unit Dev Exit": { min: 100000, max: 50000000 },
  "Permitted & Light Development": { min: 100000, max: 20000000 },
  "Semi & Commercial": { min: 100000, max: 3000000 },
  "Semi & Commercial Large Loans": { min: 3000001, max: 15000000 },
  "2nd Charge Residential Only": { min: 100000, max: 5000000 },
};
