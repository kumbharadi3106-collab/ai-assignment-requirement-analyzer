const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT, buildAnalysisPrompt } = require('../prompts/analysisPrompt');
const { validateAnalysisResponse } = require('../utils/responseValidator');

let anthropic;

function getClient() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

async function analyzeAssignment(assignmentText) {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  const userPrompt = buildAnalysisPrompt(assignmentText);

  try {
    const response = await client.messages.create({
      model: model,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const rawText = content.text.trim();

    // Extract JSON from response (handle cases where Claude adds text)
    let jsonText = rawText;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      throw new Error(`Claude returned invalid JSON: ${parseError.message}`);
    }

    // Validate the response structure
    const validation = validateAnalysisResponse(parsed);
    if (!validation.valid) {
      throw new Error(`Invalid analysis response: ${validation.errors.join(', ')}`);
    }

    return parsed;
  } catch (error) {
    if (error.message.includes('API key')) {
      throw new Error('Invalid or missing Anthropic API key. Please check your .env file.');
    }
    if (error.status === 429) {
      throw new Error('Claude API rate limit reached. Please wait a moment and try again.');
    }
    if (error.status === 500) {
      throw new Error('Claude API is temporarily unavailable. Please try again later.');
    }
    throw error;
  }
}

module.exports = { analyzeAssignment };
