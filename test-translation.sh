#!/bin/bash

# LegalEase Translation Testing Script

echo "🔄 Testing LegalEase Two-Step Translation Workflow"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m' 
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 LegalEase is running at: http://localhost:4000${NC}"
echo ""

echo "Testing Spanish → English → Spanish workflow..."
echo ""

# Test 1: Spanish business question
echo -e "${YELLOW}Test 1: Spanish Business Question${NC}"
echo "Question: ¿Qué es un ABN?"
echo ""
curl -X POST http://localhost:4000/api/legal/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Qué es un ABN?", "userLocale": "es-ES", "context": {"location": "Sydney, NSW"}}' \
  -s | jq '{
    success: .success,
    translationEvents: [.events[] | select(.type | contains("translation"))],
    answer: .answer,
    fallback: .fallback
  }'

echo ""
echo "─────────────────────────────────────────────────"
echo ""

# Test 2: Chinese business question  
echo -e "${YELLOW}Test 2: Chinese Business Question${NC}"
echo "Question: 我需要ABN吗？(Do I need an ABN?)"
echo ""
curl -X POST http://localhost:4000/api/legal/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "我需要ABN吗？", "userLocale": "zh-CN", "context": {"location": "Sydney, NSW"}}' \
  -s | jq '{
    success: .success,
    languageDetection: [.events[] | select(.type == "language_detection")][0],
    translationEvents: [.events[] | select(.type | contains("translation"))],
    answer: .answer
  }'

echo ""
echo "─────────────────────────────────────────────────"
echo ""

# Test 3: English question (should not trigger translation)
echo -e "${YELLOW}Test 3: English Question (No Translation Expected)${NC}"
echo "Question: What is an ABN?"
echo ""
curl -X POST http://localhost:4000/api/legal/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is an ABN?", "userLocale": "en-AU", "context": {"location": "Sydney, NSW"}}' \
  -s | jq '{
    success: .success,
    needsTranslation: [.events[] | select(.type == "language_detection")][0].data.needsTranslation,
    answer: .answer
  }'

echo ""
echo -e "${GREEN}✅ Translation testing completed!${NC}"
echo ""
echo -e "${BLUE}🌐 Open your browser to: http://localhost:4000${NC}"