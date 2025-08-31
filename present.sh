#!/bin/bash

# GovHack 2025 Presentation Generator
# Converts markdown to various slideshow formats

echo "🎯 GovHack 2025 Presentation Generator"
echo "======================================"

# Create presentations directory if it doesn't exist
mkdir -p presentations

echo "📝 Converting presentation to multiple formats..."

# Convert to Marp HTML slideshow
echo "🎨 Creating Marp HTML slideshow..."
marp --html --theme default --output presentations/legalease-slides.html docs/govhack-presentation.md

# Convert to PDF (if needed)
echo "📄 Creating PDF slideshow..."
marp --pdf --theme default --output presentations/legalease-slides.pdf docs/govhack-presentation.md

# Create reveal.js version
echo "🌟 Creating Reveal.js slideshow..."
reveal-md docs/govhack-presentation.md --static presentations/reveal-slides --theme black

echo ""
echo "✅ Presentation generation complete!"
echo ""
echo "📂 Available formats:"
echo "   HTML (Marp):    presentations/legalease-slides.html"
echo "   PDF:            presentations/legalease-slides.pdf"
echo "   Reveal.js:      presentations/reveal-slides/index.html"
echo ""
echo "🚀 To serve presentations locally:"
echo "   Marp HTML:      Open presentations/legalease-slides.html in browser"
echo "   Reveal.js:      cd presentations/reveal-slides && python -m http.server 8080"
echo ""
echo "💡 For live presentation mode:"
echo "   reveal-md docs/govhack-presentation.md --theme black"
echo ""
echo "🎬 Ready for your 2-minute GovHack pitch!"