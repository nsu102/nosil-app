CREATE TABLE treatments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  spec TEXT,
  description TEXT,
  concerns TEXT[],
  interval_weeks INT,
  distance INT,
  effect TEXT,
  pain INT,
  downtime TEXT,
  duration TEXT,
  sessions TEXT,
  good TEXT[],
  avoid TEXT[],
  aftercare TEXT,
  avoid_act TEXT,
  caution TEXT,
  price TEXT,
  price_range TEXT,
  event_dose TEXT,
  effective_dose TEXT,
  tips JSONB
);

CREATE TABLE categories (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT,
  address TEXT,
  phone TEXT
);

CREATE TABLE concern_data (
  concern TEXT PRIMARY KEY,
  primary_treatments TEXT[],
  secondary_treatments TEXT[],
  description TEXT
);

CREATE TABLE botox_brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  maker TEXT,
  description TEXT
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id),
  user_id UUID REFERENCES auth.users(id),
  treatment TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_records (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  treatment_name TEXT NOT NULL,
  date DATE NOT NULL,
  memo TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_routines (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  routine JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own records" ON user_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own records" ON user_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own records" ON user_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own records" ON user_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own routines" ON user_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own routines" ON user_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own routines" ON user_routines FOR UPDATE USING (auth.uid() = user_id);
