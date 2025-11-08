-- Backfill missing regions from existing driver applications

WITH normalized_apps AS (
  SELECT
    id,
    regexp_replace(COALESCE(zip_code, ''), '[^0-9]', '', 'g') AS zip_clean,
    INITCAP(COALESCE(city, '')) AS city_name,
    UPPER(COALESCE(state, '')) AS state_code
  FROM public.craver_applications
  WHERE COALESCE(zip_code, '') <> ''
),
candidate_regions AS (
  SELECT DISTINCT
    LEFT(zip_clean, 5) AS zip5,
    CASE
      WHEN city_name <> '' AND state_code <> '' THEN city_name || ', ' || state_code
      ELSE 'Region ' || LEFT(zip_clean, 5)
    END AS region_name
  FROM normalized_apps
  WHERE zip_clean <> ''
),
missing_regions AS (
  SELECT
    cr.zip5,
    cr.region_name
  FROM candidate_regions cr
  LEFT JOIN public.regions r ON r.zip_prefix = cr.zip5
  WHERE r.id IS NULL
)
INSERT INTO public.regions (name, zip_prefix, status, active_quota, display_quota)
SELECT
  region_name,
  zip5,
  'limited',
  50,
  50
FROM missing_regions;

-- Assign region_id to applications that are still missing one
WITH app_zip_data AS (
  SELECT
    id,
    regexp_replace(COALESCE(zip_code, ''), '[^0-9]', '', 'g') AS zip_clean
  FROM public.craver_applications
  WHERE COALESCE(zip_code, '') <> ''
    AND region_id IS NULL
),
region_matches AS (
  SELECT
    a.id,
    (
      SELECT r.id
      FROM public.regions r
      WHERE r.zip_prefix IN (
        LEFT(a.zip_clean, 5),
        LEFT(a.zip_clean, 3)
      )
      ORDER BY LENGTH(r.zip_prefix) DESC
      LIMIT 1
    ) AS region_id
  FROM app_zip_data a
  WHERE a.zip_clean <> ''
)
UPDATE public.craver_applications ca
SET region_id = rm.region_id
FROM region_matches rm
WHERE ca.id = rm.id
  AND rm.region_id IS NOT NULL
  AND ca.region_id IS NULL;

