export function calculateTriage(input) {
  let score = 0;
  let reasons = [];

  const { 
    symptom, 
    severity, 
    duration, 
    acuity,
    age, 
    gender,
    medications = [],
    allergies = [],
    conditions = [],
    redFlags = [] 
  } = input;

  // -----------------------
  // SYMPTOM RISK
  // -----------------------
  const symptomRisk = {
    "chest pain": 10,
    "difficulty breathing": 10,
    "fever": 4,
    "headache": 3,
    "stomach pain": 5,
    "dizziness": 4,
    "cough": 3,
    "sore throat": 2,
    "body aches": 2
  };

  const symptomLower = symptom?.toLowerCase() || "";
  if (symptomRisk[symptomLower]) {
    score += symptomRisk[symptomLower];
    reasons.push(`Symptom: ${symptom}`);
  }

  // -----------------------
  // SEVERITY (1–10)
  // -----------------------
  score += parseInt(severity) || 0;
  reasons.push(`Severity: ${severity}/10`);

  // -----------------------
  // DURATION
  // -----------------------
  const durationLower = duration?.toLowerCase() || "";
  if (durationLower.includes("less than 24")) score += 1;
  else if (durationLower.includes("1-3 days")) score += 3;
  else if (durationLower.includes("4-7 days")) score += 5;
  else if (durationLower.includes("1-2 weeks")) score += 6;
  else if (durationLower.includes("more than 2 weeks")) score += 7;

  reasons.push(`Duration: ${duration}`);

  // -----------------------
  // ACUITY (trending direction)
  // -----------------------
  const acuityLower = acuity?.toLowerCase() || "";
  if (acuityLower.includes("getting worse")) {
    score += 3;
    reasons.push("Worsening trend: higher priority");
  } else if (acuityLower.includes("getting better")) {
    score -= 1;
    reasons.push("Improving trend: lower priority");
  }

  // -----------------------
  // AGE RISK (important medically)
  // -----------------------
  if (age < 5) {
    score += 3;
    reasons.push("High-risk age: very young");
  } else if (age < 12) {
    score += 2;
    reasons.push("Age: child");
  }
  if (age > 65) {
    score += 3;
    reasons.push("High-risk age: elderly");
  } else if (age > 55) {
    score += 1;
    reasons.push("Age: senior");
  }

  // -----------------------
  // GENDER-SPECIFIC RISK FACTORS
  // -----------------------
  // Pregnancy-related check (if applicable)
  if (gender === "female" && symptom && 
      ["chest pain", "stomach pain", "dizziness"].includes(symptomLower)) {
    score += 1;
    reasons.push("Symptom may be pregnancy-related (female patient)");
  }

  // -----------------------
  // MEDICATIONS INTERACTION CHECK
  // -----------------------
  if (medications.length > 0) {
    score += medications.length * 0.5;
    reasons.push(`On ${medications.length} medication(s): ${medications.join(", ")}`);
  }

  // -----------------------
  // ALLERGIES CHECK
  // -----------------------
  if (allergies.length > 0) {
    score += allergies.length * 0.5;
    reasons.push(`Known allergies: ${allergies.join(", ")}`);
  }

  // -----------------------
  // PRE-EXISTING CONDITIONS (COMORBIDITY RISK)
  // -----------------------
  const highRiskConditions = [
    "diabetes",
    "heart disease",
    "asthma",
    "copd",
    "kidney disease",
    "liver disease",
    "cancer",
    "immunocompromised"
  ];

  conditions.forEach((condition) => {
    if (highRiskConditions.some((risk) => condition.toLowerCase().includes(risk))) {
      score += 2;
      reasons.push(`High-risk condition: ${condition}`);
    } else {
      score += 0.5;
      reasons.push(`Pre-existing: ${condition}`);
    }
  });

  // -----------------------
  // RED FLAGS (CRITICAL OVERRIDE)
  // -----------------------
  const emergencyFlags = [
    "difficulty breathing",
    "chest pain",
    "fainting",
    "confusion",
    "severe bleeding",
    "loss of consciousness"
  ];

  let emergency = false;

  for (const flag of redFlags) {
    if (emergencyFlags.includes(flag)) {
      emergency = true;
      reasons.push(`CRITICAL FLAG: ${flag}`);
    }
  }

  // -----------------------
  // FINAL CLASSIFICATION
  // -----------------------
  let level = "LOW";

  if (emergency) {
    level = "EMERGENCY";
  } else if (score >= 18) {
    level = "URGENT";
  } else if (score >= 10) {
    level = "MODERATE";
  }

  return {
    level,
    score,
    reasons
  };
}