export const intakeFlow = [
  {
    key: "symptom",
    question: "What symptom are you experiencing?",
    options: [
      "Chest pain",
      "Difficulty breathing",
      "Fever",
      "Headache",
      "Stomach pain",
      "Dizziness",
      "Cough",
      "Sore throat",
      "Body aches",
      "Other"
    ]
  },
  {
    key: "severity",
    question: "On a scale of 1–10, how severe is it?",
    options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
  },
  {
    key: "duration",
    question: "How long has this been happening?",
    options: [
      "Less than 24 hours",
      "1-3 days",
      "4-7 days",
      "1-2 weeks",
      "More than 2 weeks"
    ]
  },
  {
    key: "acuity",
    question: "Is this symptom getting worse, better, or staying the same?",
    options: [
      "Getting worse",
      "Staying the same",
      "Getting better"
    ]
  }
];