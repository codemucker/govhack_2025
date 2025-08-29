#!/bin/bash

# ask.sh - Intelligent CLI for asking legal questions
# Automatically starts Encore if needed, then sends questions to the real data pipeline API

set -e

# Default values
QUESTION=""
SESSION_ID="cli_$(date +%s)"
LOCATION=""
PORT=4000
BASE_URL="http://localhost:$PORT"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo "Usage: ./ask.sh [OPTIONS] <question>"
    echo ""
    echo "Ask legal questions using the LegalEase AI system with real Australian legal documents."
    echo ""
    echo "Options:"
    echo "  -l, --location LOCATION    Your location (e.g., 'Sydney, NSW')"
    echo "  -s, --session SESSION_ID   Session ID for tracking history"
    echo "  -p, --port PORT           API port (default: 4000)"
    echo "  -c, --cache               Cache sample documents before asking"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./ask.sh 'How do I register a business in Australia?'"
    echo "  ./ask.sh -l 'Melbourne, VIC' 'What are the food safety requirements?'"
    echo "  ./ask.sh -c 'What is the Corporations Act about?'"
    echo ""
    echo "The script will automatically:"
    echo "  • Start Encore backend if not running"
    echo "  • Cache legal documents if requested"
    echo "  • Send question to real AI-powered API"
    echo "  • Display formatted response with sources"
}

# Check if Encore is running
check_encore() {
    if curl -s "$BASE_URL/api/hello" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start Encore in background
start_encore() {
    echo -e "${YELLOW}🚀 Starting Encore backend...${NC}"
    encore run > encore.log 2>&1 &
    ENCORE_PID=$!
    
    # Wait for server to start
    echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if check_encore; then
            echo -e "${GREEN}✅ Backend started successfully!${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "\n${RED}❌ Failed to start backend. Check encore.log for details.${NC}"
    exit 1
}

# Cache documents
cache_documents() {
    echo -e "${BLUE}📄 Caching legal documents...${NC}"
    
    response=$(curl -s -X POST "$BASE_URL/api/cache-documents" \
        -H "Content-Type: application/json" \
        -d '{}' || echo '{"error": "request_failed"}')
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        docs_added=$(echo "$response" | jq -r '.documentsAdded')
        total_docs=$(echo "$response" | jq -r '.totalDocuments')
        echo -e "${GREEN}✅ Cached $docs_added new documents ($total_docs total)${NC}"
    else
        error=$(echo "$response" | jq -r '.error // "Unknown error"')
        echo -e "${YELLOW}⚠️  Document caching: $error${NC}"
    fi
    echo ""
}

# Ask question
ask_question() {
    local question="$1"
    local location="$2"
    local session="$3"
    
    echo -e "${BLUE}🤖 Asking: ${YELLOW}\"$question\"${NC}"
    if [ -n "$location" ]; then
        echo -e "${BLUE}📍 Location: $location${NC}"
    fi
    echo ""
    
    # Prepare JSON payload
    local payload=$(jq -n \
        --arg question "$question" \
        --arg sessionId "$session" \
        --arg location "$location" \
        '{
            question: $question,
            sessionId: $sessionId,
            userLocale: "en-AU"
        } + (if $location != "" then {context: {location: $location}} else {} end)')
    
    # Make API request
    response=$(curl -s -X POST "$BASE_URL/api/legal/ask" \
        -H "Content-Type: application/json" \
        -d "$payload" || echo '{"error": "request_failed"}')
    
    # Parse and display response
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}📋 Answer:${NC}"
        echo "$(echo "$response" | jq -r '.answer')"
        echo ""
        
        # Show sources
        if echo "$response" | jq -e '.sources | length > 0' > /dev/null 2>&1; then
            echo -e "${BLUE}📚 Sources:${NC}"
            echo "$response" | jq -r '.sources[] | "  • \(.title) (\(.jurisdiction))\n    \(.url)"'
            echo ""
        fi
        
        # Show metadata
        confidence=$(echo "$response" | jq -r '.confidence // "N/A"')
        exec_time=$(echo "$response" | jq -r '.executionTime // "N/A"')
        echo -e "${BLUE}📊 Confidence: ${confidence}, Execution time: ${exec_time}ms${NC}"
        
    else
        echo -e "${RED}❌ Error:${NC}"
        error=$(echo "$response" | jq -r '.error // "Unknown error"')
        echo "$error"
        exit 1
    fi
}

# Parse command line arguments
CACHE_DOCS=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -s|--session)
            SESSION_ID="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            BASE_URL="http://localhost:$PORT"
            shift 2
            ;;
        -c|--cache)
            CACHE_DOCS=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            echo "Unknown option $1"
            show_help
            exit 1
            ;;
        *)
            QUESTION="$1"
            shift
            ;;
    esac
done

# Validate question
if [ -z "$QUESTION" ]; then
    echo -e "${RED}❌ Please provide a question.${NC}"
    echo ""
    show_help
    exit 1
fi

# Main execution
echo -e "${GREEN}🏛️  LegalEase CLI - Real Data Pipeline${NC}"
echo "================================"
echo ""

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is required but not installed. Please install jq first.${NC}"
    exit 1
fi

# Start Encore if not running
if ! check_encore; then
    start_encore
else
    echo -e "${GREEN}✅ Backend is already running${NC}"
fi

# Cache documents if requested
if [ "$CACHE_DOCS" = true ]; then
    cache_documents
fi

# Ask the question
ask_question "$QUESTION" "$LOCATION" "$SESSION_ID"

echo ""
echo -e "${GREEN}✨ Done! Use the same session ID ($SESSION_ID) to continue the conversation.${NC}"