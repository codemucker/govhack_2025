-- Australian Jurisdiction and Reference Data Schema
-- This migration creates comprehensive tables for dynamic jurisdiction data management

-- Authorities table for government departments and councils
CREATE TABLE authorities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    official_name TEXT,
    jurisdiction TEXT NOT NULL,
    jurisdiction_level TEXT NOT NULL, -- federal, state, council
    website TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_chatbot TEXT,
    contact_hours TEXT,
    postal_address TEXT,
    abn TEXT,
    services TEXT, -- JSON array of services offered
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, jurisdiction)
);

-- Australian location mappings (states, councils, postcodes)
CREATE TABLE location_mappings (
    id INTEGER PRIMARY KEY,
    state_code TEXT NOT NULL, -- NSW, VIC, QLD, etc.
    state_name TEXT NOT NULL, -- New South Wales, Victoria, etc.
    council_id TEXT,
    council_name TEXT,
    council_official_name TEXT,
    postcode_ranges TEXT, -- JSON array of postcode ranges
    major_cities TEXT, -- JSON array of major cities/suburbs
    area_type TEXT, -- metro, regional, remote
    population INTEGER,
    website TEXT,
    contact_info TEXT, -- JSON object with contact details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee schedules for government services
CREATE TABLE fee_schedules (
    id INTEGER PRIMARY KEY,
    authority_id INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    service_description TEXT,
    base_cost INTEGER, -- cents
    variable_factors TEXT, -- JSON object describing cost factors
    cost_min INTEGER, -- minimum cost in cents
    cost_max INTEGER, -- maximum cost in cents
    timeframe_min INTEGER, -- minimum days
    timeframe_max INTEGER, -- maximum days
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (authority_id) REFERENCES authorities(id)
);

-- Requirement templates for legal/business processes
CREATE TABLE requirement_templates (
    id INTEGER PRIMARY KEY,
    template_name TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- business, food, building, etc.
    jurisdiction_level TEXT NOT NULL, -- federal, state, council
    jurisdiction_filter TEXT, -- specific jurisdictions this applies to (JSON array)
    mandatory BOOLEAN DEFAULT TRUE,
    priority_level TEXT DEFAULT 'medium', -- low, medium, high, urgent
    steps TEXT NOT NULL, -- JSON array of step objects
    estimated_cost_min INTEGER, -- cents
    estimated_cost_max INTEGER, -- cents  
    estimated_timeframe_min INTEGER, -- days
    estimated_timeframe_max INTEGER, -- days
    requirements TEXT, -- JSON array of requirements/documents needed
    notes TEXT, -- JSON array of notes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal areas taxonomy
CREATE TABLE legal_areas (
    id TEXT PRIMARY KEY,
    keywords TEXT NOT NULL, -- JSON array of keywords
    patterns TEXT NOT NULL, -- JSON array of regex patterns
    authorities TEXT NOT NULL, -- JSON array of relevant authority types
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authority types definition
CREATE TABLE authority_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    contact_type TEXT NOT NULL, -- phone, email, online, in-person
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jurisdiction legislation mapping
CREATE TABLE jurisdiction_legislation (
    id INTEGER PRIMARY KEY,
    jurisdiction TEXT NOT NULL,
    legal_area TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jurisdiction, legal_area)
);

-- Australian council registry (comprehensive list)
CREATE TABLE australian_councils (
    id INTEGER PRIMARY KEY,
    council_code TEXT UNIQUE NOT NULL, -- standardized code
    council_name TEXT NOT NULL,
    official_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    council_type TEXT, -- city, shire, district, etc.
    population INTEGER,
    area_sq_km REAL,
    website TEXT,
    abn TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_address TEXT,
    operating_hours TEXT,
    mayor_name TEXT,
    ceo_name TEXT,
    established_date DATE,
    postcode_ranges TEXT, -- JSON array
    major_suburbs TEXT, -- JSON array
    economic_profile TEXT, -- JSON object with economic indicators
    services_offered TEXT, -- JSON array of council services
    development_assessment_info TEXT, -- JSON object
    business_support_info TEXT, -- JSON object
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for fast lookups
CREATE INDEX idx_authorities_jurisdiction ON authorities(jurisdiction);
CREATE INDEX idx_authorities_level ON authorities(jurisdiction_level);
CREATE INDEX idx_authorities_name ON authorities(name);

CREATE INDEX idx_location_mappings_state ON location_mappings(state_code);
CREATE INDEX idx_location_mappings_council ON location_mappings(council_name);

CREATE INDEX idx_fee_schedules_authority ON fee_schedules(authority_id);
CREATE INDEX idx_fee_schedules_service ON fee_schedules(service_type);

CREATE INDEX idx_requirement_templates_activity ON requirement_templates(activity_type);
CREATE INDEX idx_requirement_templates_jurisdiction ON requirement_templates(jurisdiction_level);

CREATE INDEX idx_legal_areas_id ON legal_areas(id);
CREATE INDEX idx_authority_types_id ON authority_types(id);
CREATE INDEX idx_jurisdiction_legislation_jurisdiction ON jurisdiction_legislation(jurisdiction);
CREATE INDEX idx_jurisdiction_legislation_area ON jurisdiction_legislation(legal_area);

CREATE INDEX idx_australian_councils_state ON australian_councils(state_code);
CREATE INDEX idx_australian_councils_type ON australian_councils(council_type);
CREATE INDEX idx_australian_councils_name ON australian_councils(council_name);
CREATE INDEX idx_australian_councils_code ON australian_councils(council_code);