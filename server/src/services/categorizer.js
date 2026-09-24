import Category from '../models/Category.js';
import CategoryHint from '../models/CategoryHint.js';

// ---------------------------------------------------------------------------
// Expense categorisation assistant
//
// Given a free-text description ("Campus Cafe lunch") this suggests the category
// the student most likely means. It combines two sources of evidence:
//
//   1. Seed keywords shipped with each default category - so a brand new account
//      still gets sensible suggestions on its very first transaction.
//   2. A per-student word/category frequency table built from what that student
//      has actually saved before (see CategoryHint). Every save teaches it, and
//      because a correction records a *different* pairing than the one that was
//      suggested, correcting the assistant is exactly how it improves.
//
// Personal evidence outweighs the seed keywords, so after a handful of
// corrections a student's own habits win over the defaults.
// ---------------------------------------------------------------------------

const PERSONAL_WEIGHT = 3;
const KEYWORD_WEIGHT = 1.2;
const NAME_WEIGHT = 1.5;

// Words too common to carry any signal about a category.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'from',
  'with', 'my', 'me', 'i', 'we', 'it', 'is', 'was', 'this', 'that', 'paid', 'pay',
  'payment', 'bought', 'buy', 'got', 'get', 'new', 'some', 'today', 'yesterday',
  'rs', 'pkr', 'usd', 'inr', 'eur', 'gbp', 'aed',
]);

/** Splits a description into the comparable words used as learning features. */
export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

/** Every category this student may file a transaction under. */
export function visibleCategories(userId, type) {
  const filter = { archived: false, $or: [{ owner: userId }, { owner: null }] };
  if (type) filter.type = type;
  return Category.find(filter).sort({ name: 1 });
}

/**
 * Suggests a category for a description.
 * Returns { category, confidence, reason, alternatives } or null when there is
 * nothing to go on - in which case the UI simply asks the student to pick.
 */
export async function suggestCategory({ userId, description, type = 'expense' }) {
  const tokens = tokenize(description);
  if (!tokens.length) return null;

  const categories = await visibleCategories(userId, type);
  if (!categories.length) return null;

  const byId = new Map(categories.map((c) => [String(c._id), c]));
  const scores = new Map();
  const bump = (categoryId, points, reason) => {
    const key = String(categoryId);
    if (!byId.has(key)) return;
    const entry = scores.get(key) || { score: 0, reasons: new Set() };
    entry.score += points;
    entry.reasons.add(reason);
    scores.set(key, entry);
  };

  // 1. What this student has filed these words under before.
  const hints = await CategoryHint.find({ user: userId, token: { $in: tokens } });
  const totalPerToken = hints.reduce((acc, hint) => {
    acc[hint.token] = (acc[hint.token] || 0) + hint.count;
    return acc;
  }, {});
  for (const hint of hints) {
    const share = hint.count / (totalPerToken[hint.token] || 1);
    // Trust in a pairing grows with how often it has been seen: a third of full
    // weight after one entry (just under one seed keyword), a half after two
    // (enough to overrule one), approaching full with use. Without this, a
    // word that merely happened to appear once - "campus" in "rickshaw to
    // campus" - outvoted the food words in "chai at campus cafe".
    const seen = hint.count / (hint.count + 2);
    bump(hint.category, PERSONAL_WEIGHT * share * seen, 'your past entries');
  }

  // 2. Seed keywords and the category name itself.
  for (const category of categories) {
    const name = category.name.toLowerCase();
    for (const token of tokens) {
      if (category.keywords.includes(token)) bump(category._id, KEYWORD_WEIGHT, 'a known keyword');
      if (name.includes(token) || token.includes(name)) bump(category._id, NAME_WEIGHT, 'the category name');
    }
  }

  if (!scores.size) return null;

  const ranked = [...scores.entries()]
    .map(([id, entry]) => ({ category: byId.get(id), score: entry.score, reasons: [...entry.reasons] }))
    .sort((a, b) => b.score - a.score);

  const total = ranked.reduce((acc, row) => acc + row.score, 0);
  const best = ranked[0];

  return {
    category: best.category,
    // Share of the total score, so a single weak match does not read as certainty.
    confidence: Math.round((best.score / total) * 100) / 100,
    reason: best.reasons.join(' and '),
    alternatives: ranked.slice(1, 3).map((row) => ({
      _id: row.category._id,
      name: row.category.name,
      confidence: Math.round((row.score / total) * 100) / 100,
    })),
  };
}

/**
 * Records that this description belongs to this category. Called on every save,
 * whether the category came from the assistant or from the student overriding it.
 */
export async function learn({ userId, description, categoryId }) {
  const tokens = [...new Set(tokenize(description))];
  if (!tokens.length || !categoryId) return;

  await CategoryHint.bulkWrite(
    tokens.map((token) => ({
      updateOne: {
        filter: { user: userId, token, category: categoryId },
        update: { $inc: { count: 1 } },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

/** Suggests categories for a whole CSV import in one pass. */
export async function suggestBatch({ userId, rows }) {
  const out = [];
  for (const row of rows) {
    const suggestion = await suggestCategory({ userId, description: row.description, type: row.type });
    out.push({
      ...row,
      suggestedCategory: suggestion?.category?._id || null,
      suggestedCategoryName: suggestion?.category?.name || null,
      confidence: suggestion?.confidence || 0,
    });
  }
  return out;
}

/** How often the student accepted the assistant's proposal - shown on the AI page. */
export async function accuracyFor(Transaction, userId) {
  const rows = await Transaction.find({ user: userId, aiSuggestedCategory: { $ne: null } }).select('aiAccepted');
  const judged = rows.filter((row) => row.aiAccepted !== null);
  if (!judged.length) return { total: 0, accepted: 0, rate: null };
  const accepted = judged.filter((row) => row.aiAccepted).length;
  return { total: judged.length, accepted, rate: Math.round((accepted / judged.length) * 100) };
}
