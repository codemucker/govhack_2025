#!/bin/bash

# LegalEase CLI Demo Script
# Shows off the backend AI pipeline with various legal questions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎯 LegalEase CLI Demo - Testing Backend AI Pipeline${NC}"
echo -e "${PURPLE}====================================================${NC}"
echo ""
echo -e "${BLUE}This demo will test the LegalEase backend with various Australian legal questions.${NC}"
echo -e "${BLUE}Each question will show:${NC}"
echo -e "${BLUE}  ✅ Which legal documents were found and matched${NC}"
echo -e "${BLUE}  🤖 AI-generated legal guidance with proper disclaimers${NC}"  
echo -e "${BLUE}  📊 Token usage and cost tracking${NC}"
echo -e "${BLUE}  💾 Database storage and query history${NC}"
echo ""

# Function to run a demo query with nice formatting
demo_query() {
    local question="$1"
    local category="$2"
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📋 Testing: $category${NC}"
    echo -e "${GREEN}❓ Question: \"$question\"${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Run the CLI tool
    ./ask.sh "$question"
    
    echo ""
    echo -e "${BLUE}Press Enter to continue to next question...${NC}"
    read -r
    echo ""
}

# Demo questions covering different legal domains
echo -e "${BLUE}Ready to start demo? Press Enter to begin...${NC}"
read -r
echo ""

demo_query "How do I register a business in Australia?" "Business Registration"

demo_query "What food safety licenses do I need for a restaurant?" "Food Safety & Licensing"

demo_query "Do I need planning permission for a house extension?" "Planning & Development"

demo_query "What are my rights when buying faulty products?" "Consumer Rights"

demo_query "How do I get a liquor license in NSW?" "Liquor Licensing"

echo -e "${PURPLE}🎉 Demo Complete!${NC}"
echo -e "${PURPLE}=================${NC}"
echo ""
echo -e "${GREEN}✅ Successfully demonstrated:${NC}"
echo -e "   🔍 Document search and matching across 5 legal domains"
echo -e "   🤖 AI-powered legal guidance with OpenRouter integration"
echo -e "   📚 Comprehensive Australian legal document database"
echo -e "   💾 Query logging and history tracking"
echo -e "   📊 Token usage monitoring for cost control"
echo -e "   ⚖️  Proper legal disclaimers and safe AI responses"
echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo -e "   • Test with your own questions: ./ask.sh \"your question here\""
echo -e "   • Read full documentation: CLI_USAGE.md"
echo -e "   • Integrate with frontend for complete user experience"
echo ""
echo -e "${GREEN}Ready for GovHack 2025! 🚀${NC}"