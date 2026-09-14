// backend/carbon.js

/**
 * Standard AMS-II.G Cookstove Carbon Credit Calculation
 * Formula: ER = B_saved * fNRB * EF_woody * (1 - Leakage)
 */
function calculateAnnualCredits(fuelwoodSavedKgPerDay, fNRB = 0.88) {
  const annualWoodSavedKg = fuelwoodSavedKgPerDay * 365;
  const EF_woody = 0.001747; // tCO2e per kg dry wood burned
  const leakageFactor = 0.95; // 5% standard leakage discount

  const annualCredits = (annualWoodSavedKg / 1000) * fNRB * 1.747 * leakageFactor;
  return parseFloat(annualCredits.toFixed(2));
}

module.exports = { calculateAnnualCredits };