// src/utils/summarizer.js

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'hers', 'herself', 
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'its', 'itself', 
  'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 
  'only', 'or', 'other', 'our', 'ours', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 
  'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'were', 
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'won\'t', 
  'would', 'you', 'your'
]);

/**
 * Universal Structural Sanitizer
 */
function cleanRawText(text) {
  return text
    // 1. Strip chunk tags, paper IDs, and page markers (e.g., "00459]", "[02691]", "PAGE 02")
    .replace(/(?:\[?\b\d{4,6}\b\]?)\s*/g, '')
    .replace(/\b(?:PAGE|Pg|p\.)\s*\d+\b/gi, '')

    // 2. Fix OCR split words & numeric formatting ("I mplement" -> "Implement", "1, 054" -> "1,054")
    .replace(/\b([A-Z])\s+([a-z]{2,})\b/g, '$1$2')
    .replace(/\b(\d{1,3}),\s+(\d{3})\b/g, '$1,$2')

    // 3. Fix unpunctuate PDF line-break joins (e.g., "...question prompt injection" -> "...question: prompt injection")
    .replace(/\b([a-z]+)\n([a-z]+)\b/gi, '$1 $2')

    // 4. Strip inline section headers and uppercase title prefixes
    .replace(/(?:^|\n|\.\s+)[A-Z0-9\s_]{3,25}(?=\s+[A-Z][a-z])/g, '. ')
    .replace(/(?:^|\n|\.\s+)[A-Z][a-zA-Z0-9\s()&\/.\-]{2,40}:\s*/g, '. ')

    // 5. Clean structural dividers and bullet characters
    .replace(/(?:---|===|_|\*|•){2,}/g, ' ')
    .replace(/^[\s•\-\*\d+\.]+/gm, '')

    // 6. Normalize spaces and multiple punctuation marks
    .replace(/\s+/g, ' ')
    .replace(/(?:\s*\.\s*){2,}/g, '. ')
    .trim();
}

/**
 * Grammar and Integrity Sentence Validator
 */
function isValidSentence(text) {
  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);

  // 1. Minimum and maximum sentence length limits
  if (words.length < 8 || clean.length > 300) return false;

  // 2. Reject diagram nodes containing em-dashes with trailing step numbers (e.g., "— re-run same attacks 6.")
  if (/—\s*.*\d+$/i.test(clean) || /^\d+\./.test(clean)) return false;

  // 3. Must begin capitalized and end with valid sentence-ending punctuation
  if (!/^[A-Z0-9"]/.test(clean)) return false;
  if (!/[.!?]"?$/.test(clean)) return false;

  // 4. Reject fragmented lead verbs missing subject nouns (e.g., "Covers...", "Moves...")
  const firstWord = words[0].toLowerCase();
  if (/^(covers|moves|extends|builds|layers|integrates|creates|provides|evaluates|combine|test|reproduce)$/.test(firstWord)) {
    return false;
  }

  // 5. Reject trailing conjunctions/prepositions
  const lastWord = words[words.length - 1].replace(/[^\w]/g, '').toLowerCase();
  if (['and', 'or', 'but', 'the', 'a', 'an', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by'].includes(lastWord)) {
    return false;
  }

  // 6. Natural Stop-Word Ratio Check (filters out diagram nodes and title headers)
  const stopWordCount = words.filter(w => STOPWORDS.has(w.toLowerCase())).length;
  const ratio = stopWordCount / words.length;
  if (ratio < 0.22 || ratio > 0.65) return false;

  // 7. Title-Case Guard (rejects header strings formatted as sentences)
  const capitalized = words.filter(w => /^[A-Z]/.test(w)).length;
  if (capitalized / words.length > 0.50) return false;

  return true;
}

/**
 * Jaccard Similarity for Redundancy Removal
 */
function calculateSimilarity(str1, str2) {
  const getTokens = s => new Set(s.toLowerCase().split(/\W+/).filter(w => w && !STOPWORDS.has(w)));
  const set1 = getTokens(str1);
  const set2 = getTokens(str2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function summarizeText(text, length = 'medium') {
  if (!text || !text.trim()) {
    return { summary: '', keyPoints: [], originalWords: 0, summaryWords: 0 };
  }

  const cleaned = cleanRawText(text);
  const originalWords = cleaned.split(/\s+/).filter(Boolean).length;

  // Sentence extraction using lookahead punctuation matchers
  const rawSentences = cleaned.match(/[^.!?]+[.!?]+(?=\s+[A-Z0-9]|$)/g) || [];

  const validSentences = Array.from(
    new Set(rawSentences.map(s => s.trim()).filter(isValidSentence))
  );

  if (validSentences.length === 0) {
    return { summary: cleaned, keyPoints: [], originalWords, summaryWords: originalWords };
  }

  // Frequency Scoring (TF)
  const wordFreq = {};
  cleaned.toLowerCase().split(/\W+/).forEach(word => {
    if (word && !STOPWORDS.has(word) && word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const scored = validSentences.map((sentence, index) => {
    const tokens = sentence.toLowerCase().split(/\W+/).filter(w => w && !STOPWORDS.has(w));
    const rawScore = tokens.reduce((acc, word) => acc + (wordFreq[word] || 0), 0);
    const score = tokens.length > 0 ? rawScore / Math.sqrt(tokens.length) : 0;
    return { sentence, score, index };
  });

  const limits = {
    short: { overview: 3, keyPoints: 3 },
    medium: { overview: 4, keyPoints: 4 },
    long: { overview: 6, keyPoints: 5 }
  }[length] || { overview: 4, keyPoints: 4 };

  const sortedByScore = [...scored].sort((a, b) => b.score - a.score);

  // Build Overview
  const overviewItems = [];
  for (const item of sortedByScore) {
    if (overviewItems.length >= limits.overview) break;
    if (!overviewItems.some(prev => calculateSimilarity(prev.sentence, item.sentence) > 0.35)) {
      overviewItems.push(item);
    }
  }

  const summary = overviewItems
    .sort((a, b) => a.index - b.index)
    .map(i => i.sentence)
    .join(' ');

  // Build Key Takeaways
  const overviewSet = new Set(overviewItems.map(i => i.sentence));
  const remaining = sortedByScore.filter(i => !overviewSet.has(i.sentence));

  const keyPointsItems = [];
  for (const item of remaining) {
    if (keyPointsItems.length >= limits.keyPoints) break;
    if (!keyPointsItems.some(prev => calculateSimilarity(prev.sentence, item.sentence) > 0.30)) {
      keyPointsItems.push(item);
    }
  }

  const keyPoints = keyPointsItems
    .sort((a, b) => a.index - b.index)
    .map(i => i.sentence);

  const summaryWords = summary.split(/\s+/).filter(Boolean).length;

  return { summary, keyPoints, originalWords, summaryWords };
}