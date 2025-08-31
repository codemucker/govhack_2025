-- Drop reference data tables in reverse order of creation

DROP INDEX IF EXISTS idx_data_sources_active;
DROP INDEX IF EXISTS idx_external_data_cache_expires;
DROP INDEX IF EXISTS idx_external_data_cache_key;
DROP INDEX IF EXISTS idx_requirement_templates_activity;
DROP INDEX IF EXISTS idx_requirement_templates_jurisdiction;
DROP INDEX IF EXISTS idx_fee_schedules_active;
DROP INDEX IF EXISTS idx_fee_schedules_category;
DROP INDEX IF EXISTS idx_fee_schedules_jurisdiction;
DROP INDEX IF EXISTS idx_location_mappings_council;
DROP INDEX IF EXISTS idx_location_mappings_state;
DROP INDEX IF EXISTS idx_location_mappings_name;
DROP INDEX IF EXISTS idx_authority_contacts_active;
DROP INDEX IF EXISTS idx_authority_contacts_jurisdiction;
DROP INDEX IF EXISTS idx_jurisdictions_state_code;
DROP INDEX IF EXISTS idx_jurisdictions_type;

DROP TABLE IF EXISTS data_sources;
DROP TABLE IF EXISTS external_data_cache;
DROP TABLE IF EXISTS requirement_templates;
DROP TABLE IF EXISTS fee_schedules;
DROP TABLE IF EXISTS location_mappings;
DROP TABLE IF EXISTS authority_contacts;
DROP TABLE IF EXISTS jurisdictions;