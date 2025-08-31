#!/usr/bin/env node

/**
 * Message-based CLI - single endpoint architecture
 * 
 * Usage: node message-cli.js ask "How do I register a business?"
 */

import { config } from 'dotenv';
config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(color, text) {
  return `${color}${text}${colors.reset}`;
}

const API_URL = 'http://127.0.0.1:4000/api/message';

async function sendMessage(messageData) {
  console.log(colorize(colors.blue, '\n📤 Sending message:'));
  console.log(JSON.stringify(messageData, null, 2));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  
  console.log(colorize(colors.green, '\n📥 Response:'));
  console.log(JSON.stringify(result, null, 2));
  
  return result;
}

async function askQuestion(question) {
  console.log(colorize(colors.magenta, '\n🚀 Message-Based CLI - Ask Question'));
  console.log(colorize(colors.magenta, '===================================='));

  const message = {
    requestType: "AskQuestion",
    method: "POST",
    path: "/api/legal/ask",
    question,
    sessionId: `cli_${Date.now()}`,
    userLocale: "en-AU",
    context: {
      location: "Australia", 
      urgency: "medium"
    }
  };

  const result = await sendMessage(message);
  
  if (result.success) {
    console.log(colorize(colors.green, '\n✅ Success!'));
    console.log(colorize(colors.blue, 'Answer:'), result.answer);
    if (result.sources) {
      console.log(colorize(colors.blue, 'Sources:'), result.sources.length, 'documents');
    }
  } else {
    console.log(colorize(colors.red, '❌ Failed:'), result.error);
  }
}

async function healthCheck() {
  console.log(colorize(colors.magenta, '\n🔍 Health Check'));
  console.log(colorize(colors.magenta, '================='));

  const message = {
    requestType: "HealthCheck",
    method: "GET", 
    path: "/api/legal/health"
  };

  const result = await sendMessage(message);
  console.log(colorize(colors.green, `Status: ${result.status}`));
}

async function seedDatabase() {
  console.log(colorize(colors.magenta, '\n🌱 Seed Database'));
  console.log(colorize(colors.magenta, '================='));

  const message = {
    requestType: "SeedDatabase",
    method: "POST",
    path: "/api/legal/seed"
  };

  const result = await sendMessage(message);
  
  if (result.success) {
    console.log(colorize(colors.green, `✅ Seeded ${result.documentsAdded} documents`));
  } else {
    console.log(colorize(colors.red, '❌ Seeding failed:'), result.error);
  }
}

function showHelp() {
  console.log(colorize(colors.magenta, '\n🚀 Message-Based CLI'));
  console.log(colorize(colors.magenta, '===================='));
  console.log('\nCommands:');
  console.log('  ask "question"    Ask a legal question');
  console.log('  health           Check API health');
  console.log('  seed             Seed database');
  console.log('  help             Show this help');
  
  console.log('\nExamples:');
  console.log('  node message-cli.js ask "How do I register a business?"');
  console.log('  node message-cli.js health');
  console.log('  node message-cli.js seed');
  
  console.log(colorize(colors.blue, '\nFeatures:'));
  console.log('  • Single endpoint architecture: POST /api/message');
  console.log('  • Message type determines handler routing');
  console.log('  • Self-describing messages with metadata');
  console.log('  • No separate endpoints needed');
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    showHelp();
    return;
  }
  
  try {
    switch (command) {
      case 'ask':
        if (!args[1]) {
          console.log(colorize(colors.red, '❌ Question is required'));
          console.log('Usage: node message-cli.js ask "your question here"');
          process.exit(1);
        }
        await askQuestion(args.slice(1).join(' '));
        break;
        
      case 'health':
        await healthCheck();
        break;
        
      case 'seed':
        await seedDatabase();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        console.log(colorize(colors.red, `❌ Unknown command: ${command}`));
        showHelp();
        process.exit(1);
    }
    
  } catch (error) {
    console.log(colorize(colors.red, `❌ Command failed: ${error.message}`));
    process.exit(1);
  }
}

main().catch(error => {
  console.log(colorize(colors.red, `❌ Fatal error: ${error.message}`));
  process.exit(1);
});