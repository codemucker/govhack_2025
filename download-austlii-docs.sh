#!/bin/bash

# AustLII Document Downloader
# Downloads Australian legislation documents to verify bot detection measures
# Usage: ./download-austlii-docs.sh [mode] [delay]
# Modes: test (5 docs), small (20 docs), medium (50 docs), full (all docs)
# Delay: seconds between requests (default: 30)

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOWNLOAD_DIR="$SCRIPT_DIR/downloaded_docs"
LOG_FILE="$SCRIPT_DIR/download.log"
URL_LIST="$SCRIPT_DIR/austlii_urls.txt"
MODE="${1:-test}"
DELAY="${2:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${1}" | tee -a "$LOG_FILE"
}

# Create directories
mkdir -p "$DOWNLOAD_DIR"

# Generate URL list from our seeded data
generate_url_list() {
    log "${BLUE}📋 Generating URL list from database...${NC}"
    
    node -e "
    import { PersistentDatabase } from './persistent-database.js';
    
    const db = new PersistentDatabase();
    await db.initialize();
    
    const urls = await db.allQuery(\`
        SELECT url, jurisdiction, document_type 
        FROM documents 
        WHERE url LIKE '%austlii.edu.au%' 
        ORDER BY jurisdiction, document_type
    \`);
    
    urls.forEach(doc => {
        console.log(\`\${doc.url}|\${doc.jurisdiction}|\${doc.document_type}\`);
    });
    " > "$URL_LIST"
    
    local url_count=$(wc -l < "$URL_LIST")
    log "${GREEN}✅ Generated list of $url_count URLs${NC}"
}

# Download a single document with curl
download_document() {
    local url="$1"
    local jurisdiction="$2"
    local doc_type="$3"
    local index="$4"
    local total="$5"
    
    # Create safe filename
    local filename=$(echo "$url" | sed 's|https://||g' | sed 's|/|_|g' | sed 's/[^a-zA-Z0-9._-]/_/g')
    local filepath="$DOWNLOAD_DIR/${jurisdiction}_${doc_type}_${filename}.html"
    
    log "${BLUE}[$index/$total] 🌐 Downloading: $jurisdiction - $doc_type${NC}"
    log "${BLUE}    URL: $url${NC}"
    
    # Use curl with browser-like headers
    if curl -s -L \
        --max-time 30 \
        --connect-timeout 10 \
        --retry 2 \
        --retry-delay 2 \
        --user-agent "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
        --header "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
        --header "Accept-Language: en-US,en;q=0.9" \
        --header "Accept-Encoding: gzip, deflate" \
        --header "DNT: 1" \
        --header "Cache-Control: no-cache" \
        --header "Referer: https://www.austlii.edu.au/" \
        --compressed \
        "$url" \
        -o "$filepath"; then
        
        # Check if we got actual content (not an error page)
        local file_size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null)
        if [ "$file_size" -gt 1000 ]; then
            # Check for legal content indicators
            if grep -i -q "section\|act\|regulation\|penalty" "$filepath"; then
                log "${GREEN}✅ Success: $file_size bytes, legal content detected${NC}"
                return 0
            else
                log "${YELLOW}⚠️  Warning: $file_size bytes, but no legal indicators found${NC}"
                return 1
            fi
        else
            log "${RED}❌ Failed: File too small ($file_size bytes) - likely error page${NC}"
            rm -f "$filepath"
            return 1
        fi
    else
        log "${RED}❌ Failed: Curl request failed${NC}"
        rm -f "$filepath"
        return 1
    fi
}

# Main download function
download_documents() {
    local mode="$1"
    local delay="$2"
    
    log "${BLUE}🎯 Starting AustLII Document Download${NC}"
    log "${BLUE}Mode: $mode, Delay: ${delay}s between requests${NC}"
    log "${BLUE}Download directory: $DOWNLOAD_DIR${NC}"
    log "${BLUE}$(date)${NC}"
    echo ""
    
    # Determine how many URLs to process based on mode
    local limit_cmd=""
    case "$mode" in
        "test")
            limit_cmd="head -5"
            log "${YELLOW}🧪 TEST MODE: Processing first 5 URLs${NC}"
            ;;
        "small")
            limit_cmd="head -20"
            log "${YELLOW}📦 SMALL MODE: Processing first 20 URLs${NC}"
            ;;
        "medium")
            limit_cmd="head -50"
            log "${YELLOW}📊 MEDIUM MODE: Processing first 50 URLs${NC}"
            ;;
        "full")
            limit_cmd="cat"
            log "${YELLOW}🚀 FULL MODE: Processing all URLs${NC}"
            ;;
        *)
            log "${RED}❌ Invalid mode: $mode. Use: test, small, medium, or full${NC}"
            exit 1
            ;;
    esac
    
    # Count total URLs to process
    local total=$(eval "$limit_cmd" "$URL_LIST" | wc -l)
    log "${BLUE}📋 Total URLs to process: $total${NC}"
    echo ""
    
    # Download documents
    local success_count=0
    local fail_count=0
    local index=1
    
    eval "$limit_cmd" "$URL_LIST" | while IFS='|' read -r url jurisdiction doc_type; do
        if [ -n "$url" ]; then
            if download_document "$url" "$jurisdiction" "$doc_type" "$index" "$total"; then
                ((success_count++))
            else
                ((fail_count++))
            fi
            
            # Progress indicator
            local progress=$((index * 100 / total))
            log "${BLUE}📊 Progress: $index/$total ($progress%) - Success: $success_count, Failed: $fail_count${NC}"
            
            # Rate limiting (except for last item)
            if [ "$index" -lt "$total" ]; then
                log "${YELLOW}⏸️  Waiting ${delay}s before next request...${NC}"
                sleep "$delay"
            fi
            
            ((index++))
        fi
    done
    
    echo ""
    log "${GREEN}🎉 Download completed!${NC}"
    log "${GREEN}📊 Final Results:${NC}"
    log "${GREEN}  - Total processed: $total${NC}"
    log "${GREEN}  - Successful: $success_count${NC}"
    log "${GREEN}  - Failed: $fail_count${NC}"
    
    if [ "$success_count" -gt 0 ]; then
        local success_rate=$((success_count * 100 / total))
        log "${GREEN}  - Success rate: $success_rate%${NC}"
        
        # List downloaded files
        log "${BLUE}📁 Downloaded files:${NC}"
        find "$DOWNLOAD_DIR" -name "*.html" -type f -exec ls -lh {} \; | head -10
        
        if [ "$(find "$DOWNLOAD_DIR" -name "*.html" -type f | wc -l)" -gt 10 ]; then
            log "${BLUE}... and $(find "$DOWNLOAD_DIR" -name "*.html" -type f | wc -l | awk '{print $1-10}') more files${NC}"
        fi
    fi
}

# Analyze downloaded content
analyze_content() {
    log "${BLUE}🔍 Analyzing downloaded content...${NC}"
    
    local total_files=$(find "$DOWNLOAD_DIR" -name "*.html" -type f | wc -l)
    if [ "$total_files" -eq 0 ]; then
        log "${YELLOW}⚠️  No files to analyze${NC}"
        return
    fi
    
    log "${BLUE}📊 Content Analysis:${NC}"
    log "${BLUE}  - Total files: $total_files${NC}"
    
    # File sizes
    local avg_size=$(find "$DOWNLOAD_DIR" -name "*.html" -type f -exec stat -f%z {} \; 2>/dev/null || find "$DOWNLOAD_DIR" -name "*.html" -type f -exec stat -c%s {} \; 2>/dev/null | awk '{sum+=$1; count++} END {print int(sum/count)}')
    log "${BLUE}  - Average size: ${avg_size} bytes${NC}"
    
    # Check for common legal terms
    local legal_terms=("section" "act" "regulation" "penalty" "offence" "subsection")
    for term in "${legal_terms[@]}"; do
        local count=$(find "$DOWNLOAD_DIR" -name "*.html" -type f -exec grep -l -i "$term" {} \; | wc -l)
        local percentage=$((count * 100 / total_files))
        log "${BLUE}  - Files with '$term': $count ($percentage%)${NC}"
    done
    
    # Sample content from a successful download
    local sample_file=$(find "$DOWNLOAD_DIR" -name "*.html" -type f | head -1)
    if [ -n "$sample_file" ]; then
        log "${BLUE}📋 Sample content preview:${NC}"
        head -20 "$sample_file" | grep -v "^$" | head -5 | sed 's/^/    /'
    fi
}

# Help function
show_help() {
    cat << EOF
AustLII Document Downloader

Usage: $0 [mode] [delay]

MODES:
  test     Download first 5 documents (for testing)
  small    Download first 20 documents  
  medium   Download first 50 documents
  full     Download all documents (100+)

DELAY:
  Seconds to wait between requests (default: 30)
  Recommended: 30-60 seconds to be respectful

EXAMPLES:
  $0 test 10           # Test mode with 10s delay
  $0 small 30          # Small batch with 30s delay  
  $0 medium 60         # Medium batch with 60s delay
  $0 full 45           # Full download with 45s delay

OUTPUT:
  Files saved to: $DOWNLOAD_DIR
  Log saved to: $LOG_FILE
EOF
}

# Main execution
main() {
    # Clear log file
    > "$LOG_FILE"
    
    case "${1:-}" in
        "-h"|"--help"|"help")
            show_help
            exit 0
            ;;
    esac
    
    log "${GREEN}🎯 AustLII Document Downloader${NC}"
    log "${GREEN}=================================${NC}"
    
    # Generate URL list
    generate_url_list
    
    # Check if URL list was created successfully
    if [ ! -f "$URL_LIST" ] || [ ! -s "$URL_LIST" ]; then
        log "${RED}❌ Failed to generate URL list${NC}"
        exit 1
    fi
    
    # Download documents
    download_documents "$MODE" "$DELAY"
    
    # Analyze results
    analyze_content
    
    log "${GREEN}✅ Process completed. Check $LOG_FILE for detailed logs.${NC}"
}

# Run main function
main "$@"