import Database from 'better-sqlite3';

interface Document {
  title: string;
  jurisdiction: string;
  tags: string;
}

const db = new Database('./data/legalease.db', { readonly: true });

console.log('🔍 Checking Queensland documents...');
const qldDocs = db.prepare(`
  SELECT title, jurisdiction, tags 
  FROM documents 
  WHERE jurisdiction = 'Queensland' 
  ORDER BY id DESC
  LIMIT 10
`).all() as Document[];

console.log(`Found ${qldDocs.length} Queensland documents:`);
qldDocs.forEach((doc: Document, i: number) => {
  console.log(`${i+1}. ${doc.title}`);
  console.log(`   Jurisdiction: ${doc.jurisdiction}`);
  console.log(`   Tags: ${doc.tags}`);
  console.log('');
});

console.log('\n📊 Database Statistics:');
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total_docs,
    COUNT(DISTINCT jurisdiction) as jurisdictions,
    COUNT(CASE WHEN synthetic = 1 THEN 1 END) as synthetic_docs
  FROM documents
`).get() as {total_docs: number, jurisdictions: number, synthetic_docs: number};

console.log(`Total documents: ${stats.total_docs}`);
console.log(`Jurisdictions: ${stats.jurisdictions}`);
console.log(`Synthetic documents: ${stats.synthetic_docs}`);

db.close();