import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Optional narrative polish for the monthly insight.
//
// Campus Coin computes every number itself (see insights.js). This module only
// rewrites those already-computed facts into friendlier prose. That ordering
// matters: the model is never asked to do arithmetic, so it cannot invent a
// figure that contradicts the database, and the whole feature can be switched
// off by simply not setting ANTHROPIC_API_KEY.
// ---------------------------------------------------------------------------

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

export const llmEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client = null;
const getClient = () => {
  if (!client) client = new Anthropic();
  return client;
};

const SYSTEM = [
  'You write one short monthly money summary for a university student using a budgeting app.',
  'You are given facts that were already calculated from the student\'s own transactions.',
  'Rules:',
  '- Use only the numbers you are given. Never calculate, estimate or invent a figure.',
  '- Two or three sentences, warm and plain, no jargon, no emoji, no markdown.',
  '- Name the single clearest pattern, then give one specific thing to try next month.',
  '- Never tell the student what to invest in and never present this as financial advice.',
].join('\n');

/**
 * Rewrites the statistical summary as prose.
 * Returns null on any failure so the caller keeps its own text - the feature is
 * an enhancement, never a dependency.
 */
export async function narrateInsight({ facts, currency }) {
  if (!llmEnabled()) return null;

  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      // If a safety classifier ever declines, the API retries on a fallback model
      // inside the same call rather than returning nothing.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        {
          role: 'user',
          content: `Currency: ${currency}\n\nFacts:\n${JSON.stringify(facts, null, 2)}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') return null;

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    return text || null;
  } catch (err) {
    console.error('[llm] falling back to the built-in summary:', err.message);
    return null;
  }
}

const CHAT_SYSTEM = [
  'You are the chat assistant inside Campus Coin, a budgeting app for university students.',
  'You are given one question from the student and facts already calculated from their own transactions.',
  'Rules:',
  '- Answer only from the facts given. Never calculate a new figure, estimate or invent one.',
  '- If the facts do not answer the question, say so in one sentence and suggest what they could ask instead.',
  '- Only talk about the student\'s own money in this app. Politely decline anything else.',
  '- One to three short sentences, plain and friendly, no markdown, no emoji.',
  '- Never recommend investments and never present anything as financial advice.',
].join('\n');

/**
 * Answers a chat question the rule-based assistant did not recognise.
 * Like narrateInsight, it returns null on any failure so the caller can fall
 * back to its own reply.
 */
export async function answerQuestion({ question, facts, currency }) {
  if (!llmEnabled()) return null;

  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: CHAT_SYSTEM,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        {
          role: 'user',
          content: `Currency: ${currency}\n\nFacts:\n${JSON.stringify(facts, null, 2)}\n\nQuestion: ${String(question).slice(0, 500)}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') return null;

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    return text || null;
  } catch (err) {
    console.error('[llm] chat fallback failed:', err.message);
    return null;
  }
}
