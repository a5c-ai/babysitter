'use strict';

function shrinkPrompt(prompt, options = {}) {
  const text = String(prompt || '');
  const maxChars = Number(options.maxChars || 3000);
  if (!Number.isFinite(maxChars) || maxChars <= 0) return text;
  if (text.length <= maxChars) return text;

  const head = text.slice(0, Math.floor(maxChars * 0.65));
  const tail = text.slice(text.length - Math.floor(maxChars * 0.30));
  return `${head}\n\n[...prompt truncated for budget...]\n\n${tail}`;
}

module.exports = {
  shrinkPrompt,
};
