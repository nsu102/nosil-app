CREATE TABLE dosage_guide (
  treatment_name TEXT PRIMARY KEY REFERENCES treatments(name),
  event TEXT NOT NULL,
  recommended TEXT NOT NULL,
  unit TEXT NOT NULL
);
