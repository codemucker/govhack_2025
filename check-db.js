import Database from 'better-sqlite3';

const db = new Database('./data/legalease.db', { readonly: true });

console.log('🔍 Checking Queensland documents...');
const qldDocs = db.prepare(`
  SELECT title, jurisdiction, tags 
  FROM documents 
  WHERE jurisdiction = 'Queensland' 
  ORDER BY id DESC
  LIMIT 10
`).all();

console.log(`Found ${qldDocs.length} Queensland documents:`);
qldDocs.forEach((doc, i) => {
  console.log(`${i+1}. ${doc.title}`);
  console.log(`   Jurisdiction: ${doc.jurisdiction}`);
  console.log(`   Tags: ${doc.tags}`);
  console.log('');
});

console.log('🔍 Looking for solar-related documents...');
const solarDocs = db.prepare(`
  SELECT title, jurisdiction, tags 
  FROM documents 
  WHERE tags LIKE '%solar%' OR title LIKE '%solar%' OR title LIKE '%renewable%'
  ORDER BY id DESC
  LIMIT 10
`).all();

console.log(`Found ${solarDocs.length} solar-related documents:`);
solarDocs.forEach((doc, i) => {
  console.log(`${i+1}. ${doc.title}`);
  console.log(`   Jurisdiction: ${doc.jurisdiction}`);
  console.log(`   Tags: ${doc.tags}`);
  console.log('');
});

db.close();