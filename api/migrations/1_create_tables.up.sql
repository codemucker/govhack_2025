-- Create the docs table for caching AustLII documents
CREATE TABLE docs (
    id TEXT PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    tags TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the queries table for logging user interactions
CREATE TABLE queries (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT,
    docs_used TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster URL lookups
CREATE INDEX idx_docs_url ON docs(url);