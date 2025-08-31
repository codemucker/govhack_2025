-- Create reference data tables for dynamic data management

-- Jurisdictions table (states, territories, councils)
CREATE TABLE jurisdictions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    official_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('federal', 'state', 'territory', 'council', 'region')),
    parent_jurisdiction_id TEXT,
    state_code TEXT,
    council_code TEXT,
    abn TEXT,
    website_url TEXT,
    api_endpoint TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_jurisdiction_id) REFERENCES jurisdictions(id)
);

-- Contact information for authorities
CREATE TABLE authority_contacts (
    id TEXT PRIMARY KEY,
    jurisdiction_id TEXT NOT NULL,
    authority_name TEXT NOT NULL,
    contact_type TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website_url TEXT NOT NULL,
    physical_address TEXT,
    postal_address TEXT,
    operating_hours TEXT,
    services TEXT, -- JSON array of services offered
    last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(id)
);

-- Location mappings (suburbs, cities to councils)
CREATE TABLE location_mappings (
    id TEXT PRIMARY KEY,
    location_name TEXT NOT NULL,
    location_type TEXT NOT NULL CHECK (location_type IN ('suburb', 'city', 'postcode', 'region')),
    state_code TEXT NOT NULL,
    council_id TEXT NOT NULL,
    postcode_range TEXT,
    latitude REAL,
    longitude REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (council_id) REFERENCES jurisdictions(id)
);

-- Fee and cost information
CREATE TABLE fee_schedules (
    id TEXT PRIMARY KEY,
    jurisdiction_id TEXT NOT NULL,
    fee_category TEXT NOT NULL,
    fee_type TEXT NOT NULL,
    description TEXT NOT NULL,
    min_cost REAL,
    max_cost REAL,
    currency TEXT DEFAULT 'AUD',
    unit TEXT, -- e.g., 'per application', 'per hour', 'per square meter'
    conditions TEXT, -- JSON array of conditions
    source_url TEXT,
    effective_date DATE,
    expiry_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(id)
);

-- Requirement templates for different activities
CREATE TABLE requirement_templates (
    id TEXT PRIMARY KEY,
    jurisdiction_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    requirement_category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    estimated_timeframe TEXT,
    steps TEXT NOT NULL, -- JSON array of steps
    prerequisites TEXT, -- JSON array of prerequisite requirements
    source_url TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(id)
);

-- Cache table for external API responses
CREATE TABLE external_data_cache (
    id TEXT PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    data_source TEXT NOT NULL,
    response_data TEXT NOT NULL, -- JSON response
    request_params TEXT, -- JSON of original request parameters
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data source configuration
CREATE TABLE data_sources (
    id TEXT PRIMARY KEY,
    source_name TEXT UNIQUE NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('api', 'scraper', 'manual')),
    base_url TEXT,
    api_key_required BOOLEAN DEFAULT FALSE,
    rate_limit_per_hour INTEGER DEFAULT 100,
    cache_duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    config TEXT, -- JSON configuration for the data source
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_jurisdictions_type ON jurisdictions(type);
CREATE INDEX idx_jurisdictions_state_code ON jurisdictions(state_code);
CREATE INDEX idx_authority_contacts_jurisdiction ON authority_contacts(jurisdiction_id);
CREATE INDEX idx_authority_contacts_active ON authority_contacts(is_active);
CREATE INDEX idx_location_mappings_name ON location_mappings(location_name);
CREATE INDEX idx_location_mappings_state ON location_mappings(state_code);
CREATE INDEX idx_location_mappings_council ON location_mappings(council_id);
CREATE INDEX idx_fee_schedules_jurisdiction ON fee_schedules(jurisdiction_id);
CREATE INDEX idx_fee_schedules_category ON fee_schedules(fee_category, fee_type);
CREATE INDEX idx_fee_schedules_active ON fee_schedules(is_active);
CREATE INDEX idx_requirement_templates_jurisdiction ON requirement_templates(jurisdiction_id);
CREATE INDEX idx_requirement_templates_activity ON requirement_templates(activity_type);
CREATE INDEX idx_external_data_cache_key ON external_data_cache(cache_key);
CREATE INDEX idx_external_data_cache_expires ON external_data_cache(expires_at);
CREATE INDEX idx_data_sources_active ON data_sources(is_active);