#!/usr/bin/env node

// AustLII URL Updater - Update URLs to current working format
// Addresses the issue of changing URL structures and document relocations

import { PersistentDatabase } from './persistent-database.js';
import fetch from 'node-fetch';

export class LegislationURLUpdater {
  constructor() {
    this.db = null;
  }

  async initialize() {
    this.db = new PersistentDatabase();
    await this.db.initialize();
  }

  // Current working AustLII URLs (verified as of 2024)
  getCurrentWorkingAustLIIUrls() {
    return {
      'QLD': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/s1.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/fa200657/index.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/fr2006488/index.html'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/ba1975157/index.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_reg/br2006291/index.html'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/epa1994323/index.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/wmra2011396/index.html'
        ],
        'Liquor Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/la1992107/index.html'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/whsa2011218/index.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/qld/consol_act/pha2005170/index.html'
        ]
      },
      'NSW': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/fa200357/index.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_reg/fr2015364/index.html'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/ba1993141/index.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/hba1989197/index.html'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/poea1997160/index.html',
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/wmaa2007194/index.html'
        ],
        'Liquor Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/la2007107/index.html'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/whsa2011218/index.html'
        ]
      },
      'VIC': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/fa1984220/index.html'
        ],
        'Building and Construction': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/ba1993141/index.html'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/epa2017188/index.html'
        ],
        'Liquor Licensing': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/lcra1998266/index.html'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/vic/consol_act/ohsa2004273/index.html'
        ]
      },
      'Federal': {
        'Food Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fsa1991109/index.html'
        ],
        'Environmental Protection': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/epbca1999588/index.html'
        ],
        'Health and Safety': [
          'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/whsa2011218/index.html'
        ]
      }
    };
  }

  // Alternative URL patterns to try for AustLII documents
  generateAlternativeUrls(baseUrl) {
    const alternatives = [];
    
    // Original URL
    alternatives.push(baseUrl);
    
    // Add index.html if missing
    if (!baseUrl.endsWith('index.html') && !baseUrl.endsWith('.html')) {
      alternatives.push(baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'index.html');
    }
    
    // Try section 1
    if (!baseUrl.includes('.html')) {
      alternatives.push(baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 's1.html');
    }
    
    // Try removing trailing slash
    if (baseUrl.endsWith('/')) {
      alternatives.push(baseUrl.slice(0, -1));
    }
    
    return alternatives;
  }

  async testUrlAvailability(url) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LegalEase/1.0; +http://localhost:4000/)'
        },
        timeout: 10000
      });
      
      return {
        url,
        status: response.status,
        available: response.status === 200,
        redirected: response.redirected,
        finalUrl: response.url
      };
    } catch (error) {
      return {
        url,
        status: 0,
        available: false,
        error: error.message
      };
    }
  }

  async findWorkingUrl(originalUrl) {
    const alternatives = this.generateAlternativeUrls(originalUrl);
    
    for (const altUrl of alternatives) {
      const result = await this.testUrlAvailability(altUrl);
      
      if (result.available) {
        return result;
      }
      
      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
  }

  async updateBrokenUrls() {
    console.log('🔍 Finding and updating broken AustLII URLs...');
    
    // Get all AustLII documents with empty content
    const brokenDocs = await this.db.allQuery(`
      SELECT url, jurisdiction, document_type 
      FROM documents 
      WHERE url LIKE '%austlii.edu.au%' 
      AND (content = '' OR content IS NULL)
      LIMIT 20
    `);

    console.log(`📋 Found ${brokenDocs.length} potentially broken URLs to test`);
    
    let updatedCount = 0;
    let totalTested = 0;

    for (const doc of brokenDocs) {
      totalTested++;
      console.log(`\\n🧪 Testing ${totalTested}/${brokenDocs.length}: ${doc.url}`);
      
      const workingUrl = await this.findWorkingUrl(doc.url);
      
      if (workingUrl && workingUrl.url !== doc.url) {
        console.log(`✅ Found working alternative: ${workingUrl.url}`);
        
        try {
          // Update the URL in the database
          await this.db.runQuery(`
            UPDATE documents 
            SET url = ?, updated_at = datetime('now')
            WHERE url = ?
          `, [workingUrl.url, doc.url]);
          
          updatedCount++;
          console.log(`💾 Updated database with working URL`);
        } catch (error) {
          console.error(`❌ Failed to update database: ${error.message}`);
        }
      } else if (workingUrl && workingUrl.available) {
        console.log(`✅ Original URL is working`);
      } else {
        console.log(`❌ No working alternative found`);
      }
    }

    console.log(`\\n📊 URL Update Summary:`);
    console.log(`🧪 URLs tested: ${totalTested}`);
    console.log(`✅ URLs updated: ${updatedCount}`);
    
    return { tested: totalTested, updated: updatedCount };
  }

  async addCurrentWorkingUrls() {
    console.log('🌱 Adding current working AustLII URLs...');
    
    const currentUrls = this.getCurrentWorkingAustLIIUrls();
    let addedCount = 0;
    
    for (const [jurisdiction, legalAreas] of Object.entries(currentUrls)) {
      for (const [legalArea, urls] of Object.entries(legalAreas)) {
        for (const url of urls) {
          try {
            // Test if URL is actually working
            const result = await this.testUrlAvailability(url);
            
            if (result.available) {
              // Check if already exists
              const existing = await this.db.getQuery(
                'SELECT url FROM documents WHERE url = ?',
                [url]
              );
              
              if (!existing) {
                // Add new working URL
                await this.db.runQuery(`
                  INSERT INTO documents (
                    url, jurisdiction, document_type, content, 
                    synthetic, created_at
                  ) VALUES (?, ?, ?, ?, ?, datetime('now'))
                `, [
                  url,
                  jurisdiction,
                  'act',
                  '', // Content will be fetched later
                  false
                ]);
                
                addedCount++;
                console.log(`✅ Added working URL: ${url}`);
              }
            } else {
              console.log(`❌ URL not working: ${url} (${result.status})`);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`💥 Error processing ${url}: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`\\n📊 Added ${addedCount} new working URLs`);
    return addedCount;
  }

  async getUrlHealthReport() {
    console.log('📊 Generating URL Health Report...');
    
    const totalDocs = await this.db.getQuery(`
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE url LIKE '%austlii.edu.au%'
    `);
    
    const emptyDocs = await this.db.getQuery(`
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE url LIKE '%austlii.edu.au%' 
      AND (content = '' OR content IS NULL)
    `);
    
    const withContent = await this.db.getQuery(`
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE url LIKE '%austlii.edu.au%' 
      AND content != '' 
      AND content IS NOT NULL
    `);
    
    return {
      total: totalDocs?.count || 0,
      empty: emptyDocs?.count || 0,
      withContent: withContent?.count || 0,
      healthPercentage: totalDocs?.count > 0 ? Math.round(((withContent?.count || 0) / totalDocs.count) * 100) : 0
    };
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new LegislationURLUpdater();
  
  async function runUpdate() {
    try {
      await updater.initialize();
      
      console.log('🎯 AustLII URL Health Check and Update Process');
      console.log('='.repeat(60));
      
      // Get initial health report
      const initialHealth = await updater.getUrlHealthReport();
      console.log(`\\n📊 INITIAL URL HEALTH:`);
      console.log(`📚 Total AustLII URLs: ${initialHealth.total}`);
      console.log(`📄 URLs with content: ${initialHealth.withContent}`);
      console.log(`❌ Empty URLs: ${initialHealth.empty}`);
      console.log(`🏥 Health: ${initialHealth.healthPercentage}%`);
      
      // Update broken URLs
      const updateResults = await updater.updateBrokenUrls();
      
      // Add current working URLs
      const addedCount = await updater.addCurrentWorkingUrls();
      
      // Get final health report
      const finalHealth = await updater.getUrlHealthReport();
      
      console.log('\\n' + '='.repeat(60));
      console.log('🎯 FINAL RESULTS');
      console.log('='.repeat(60));
      console.log(`🔧 URLs tested and updated: ${updateResults.updated}`);
      console.log(`🌱 New working URLs added: ${addedCount}`);
      console.log(`\\n📊 FINAL URL HEALTH:`);
      console.log(`📚 Total AustLII URLs: ${finalHealth.total}`);
      console.log(`📄 URLs with content: ${finalHealth.withContent}`);
      console.log(`❌ Empty URLs: ${finalHealth.empty}`);
      console.log(`🏥 Health: ${finalHealth.healthPercentage}%`);
      
      if (finalHealth.healthPercentage > initialHealth.healthPercentage) {
        console.log(`\\n🎉 SUCCESS: URL health improved by ${finalHealth.healthPercentage - initialHealth.healthPercentage}%`);
      } else if (addedCount > 0 || updateResults.updated > 0) {
        console.log(`\\n✅ PROGRESS: Made updates but may need more work`);
      } else {
        console.log(`\\n⚠️ WARNING: No improvements made - may need manual intervention`);
      }
      
    } catch (error) {
      console.error('💥 Update failed:', error);
      process.exit(1);
    }
  }
  
  runUpdate();
}