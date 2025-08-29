// OpenAI client for real AI-powered responses
import 'dotenv/config';

// OpenAI API configuration
// Read from .env file for local development
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface OpenAIResponse {
  answer: string;
  tokensUsed?: number;
}

export class OpenAIClient {
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  async generateAnswer(question: string, context: string, userLocale = 'en-AU'): Promise<OpenAIResponse> {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    try {
      const prompt = this.buildPrompt(question, context, userLocale);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an Australian legal research assistant. Provide accurate, helpful information based solely on the provided legal documents. Always include appropriate disclaimers about seeking professional legal advice.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json() as any;
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated from OpenAI');
      }

      return {
        answer: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildPrompt(question: string, context: string, userLocale: string): string {
    const localeSettings = this.getLocaleSettings(userLocale);
    
    return `Based on the following Australian legal documents, please answer this question:

QUESTION: ${question}

CONTEXT FROM LEGAL DOCUMENTS:
${context}

INSTRUCTIONS:
- Answer in ${localeSettings.language} using ${localeSettings.style}
- Base your answer ONLY on the provided legal documents
- If the documents don't contain relevant information, state this clearly
- Include specific references to which acts or regulations you're citing
- Use ${localeSettings.dateFormat} for any dates
- Always end with the standard legal disclaimer

LEGAL DISCLAIMER TO INCLUDE:
"⚠️ IMPORTANT: This information is general in nature and should not be considered legal advice. Australian laws can be complex and may vary by jurisdiction. For specific legal matters, please consult with a qualified legal professional or contact the relevant government department."

Please provide a clear, practical answer that helps the user understand their obligations or options under Australian law.`;
  }

  private getLocaleSettings(locale: string) {
    const settings = {
      'en-AU': {
        language: 'Australian English',
        style: 'Australian legal terminology and spelling',
        dateFormat: 'DD/MM/YYYY format'
      },
      'en-US': {
        language: 'English',
        style: 'clear, professional language',
        dateFormat: 'MM/DD/YYYY format'
      }
    };

    return settings[locale as keyof typeof settings] || settings['en-AU'];
  }
}

export const openaiClient = new OpenAIClient();