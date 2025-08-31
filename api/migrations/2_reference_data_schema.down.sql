-- Drop reference data schema tables
DROP INDEX IF EXISTS idx_australian_councils_code;
DROP INDEX IF EXISTS idx_australian_councils_name;
DROP INDEX IF EXISTS idx_australian_councils_type;
DROP INDEX IF EXISTS idx_australian_councils_state;

DROP INDEX IF EXISTS idx_jurisdiction_legislation_area;
DROP INDEX IF EXISTS idx_jurisdiction_legislation_jurisdiction;
DROP INDEX IF EXISTS idx_authority_types_id;
DROP INDEX IF EXISTS idx_legal_areas_id;

DROP INDEX IF EXISTS idx_requirement_templates_jurisdiction;
DROP INDEX IF EXISTS idx_requirement_templates_activity;

DROP INDEX IF EXISTS idx_fee_schedules_service;
DROP INDEX IF EXISTS idx_fee_schedules_authority;

DROP INDEX IF EXISTS idx_location_mappings_council;
DROP INDEX IF EXISTS idx_location_mappings_state;

DROP INDEX IF EXISTS idx_authorities_name;
DROP INDEX IF EXISTS idx_authorities_level;
DROP INDEX IF EXISTS idx_authorities_jurisdiction;

DROP TABLE IF EXISTS australian_councils;
DROP TABLE IF EXISTS jurisdiction_legislation;
DROP TABLE IF EXISTS authority_types;
DROP TABLE IF EXISTS legal_areas;
DROP TABLE IF EXISTS requirement_templates;
DROP TABLE IF EXISTS fee_schedules;
DROP TABLE IF EXISTS location_mappings;
DROP TABLE IF EXISTS authorities;