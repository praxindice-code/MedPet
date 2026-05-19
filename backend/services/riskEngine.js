export function calculateTriage(input) {
  let score = 0;
  let reasons = [];

  const { symptom, severity, duration, age, redFlags = [] } = input;

  // -----------------------
  // SYMPTOM RISK
  // -----------------------
  const symptomRisk = {
    "chest pain": 10,
    "difficulty breathing": 10,
    "fever": 4,
    "headache": 3,
    "stomach pain": 5,
    "dizziness": 4
  };

  if (symptomRisk[symptom]) {
    score += symptomRisk[symptom];
    reasons.push(`Symptom: ${symptom}`);
  }

  // -----------------------
  // SEVERITY (1–10)
  // -----------------------
  score += severity;
  reasons.push(`Severity: ${severity}/10`);

  // -----------------------
  // DURATION
  // -----------------------
  if (duration === "less than 24 hours") score += 1;
  if (duration === "1-3 days") score += 3;
  if (duration === "4-7 days") score += 5;
  if (duration === "1+ week") score += 7;

  reasons.push(`Duration: ${duration}`);

  // -----------------------
  // AGE RISK (important medically)
  // -----------------------
  if (age < 12) {
    score += 2;
    reasons.push("High-risk age: child");
  }
  if (age > 60) {
    score += 2;
    reasons.push("High-risk age: elderly");
  }

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
  } else if (score >= 15) {
    level = "URGENT";
  } else if (score >= 8) {
    level = "MODERATE";
  }

  return {
    level,
    score,
    reasons
  };
}