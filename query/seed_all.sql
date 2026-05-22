-- 전체 시딩 스크립트: Supabase SQL Editor에서 실행
-- 순서대로 실행해야 FK 제약조건에 걸리지 않음

-- 1. categories
\i seed_categories.sql

-- 2. treatments (categories 참조 없지만 논리적 순서)
\i seed_treatments.sql

-- 3. dosage_guide (treatments.name FK)
\i seed_dosage.sql

-- 4. hospitals
\i seed_hospitals.sql

-- 5. concern_data
\i seed_concerns.sql

-- 6. botox_brands
\i seed_botox_brands.sql

-- 7. reviews (hospitals FK, user_id nullable)
\i seed_reviews.sql
