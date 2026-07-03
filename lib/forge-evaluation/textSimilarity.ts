const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "and",
  "but",
  "if",
  "or",
  "because",
  "until",
  "while",
  "about",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "am",
  "your",
  "you",
  "yours",
  "me",
  "my",
  "i",
  "we",
  "our",
  "they",
  "their",
  "it",
  "its",
]);

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function buildBigrams(tokens: string[]): Set<string> {
  const bigrams = new Set<string>();

  for (let index = 0; index < tokens.length - 1; index += 1) {
    bigrams.add(`${tokens[index]} ${tokens[index + 1]}`);
  }

  return bigrams;
}

function jaccardSimilarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) {
    return 1;
  }

  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const item of left) {
    if (right.has(item)) {
      intersection += 1;
    }
  }

  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function computeTextSimilarity(left: string, right: string): number {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  const tokenSetLeft = new Set(leftTokens);
  const tokenSetRight = new Set(rightTokens);
  const tokenSimilarity = jaccardSimilarity(tokenSetLeft, tokenSetRight);

  const bigramLeft = buildBigrams(leftTokens);
  const bigramRight = buildBigrams(rightTokens);
  const bigramSimilarity = jaccardSimilarity(bigramLeft, bigramRight);

  const leftNormalized = normalizeText(left);
  const rightNormalized = normalizeText(right);
  const containsMatch =
    leftNormalized.includes(rightNormalized) ||
    rightNormalized.includes(leftNormalized)
      ? 0.85
      : 0;

  return Math.max(
    tokenSimilarity * 0.45 + bigramSimilarity * 0.55,
    containsMatch,
  );
}

export interface SimilarityMatch {
  pattern: string;
  score: number;
}

export function findBestSimilarityMatch(
  text: string,
  patterns: string[],
): SimilarityMatch | null {
  let best: SimilarityMatch | null = null;

  for (const pattern of patterns) {
    const score = computeTextSimilarity(text, pattern);

    if (!best || score > best.score) {
      best = { pattern, score };
    }
  }

  return best;
}
