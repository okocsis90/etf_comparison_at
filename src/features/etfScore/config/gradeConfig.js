/**
 * Tax-efficiency grade configuration.
 *
 * Single source of truth for colours, labels, thresholds, and the helper
 * that maps a 0-100 numeric score to its corresponding colour.
 */

/** @type {Record<string, string>} */
export const GRADE_COLORS = {
  A: '#2e7d32',
  B: '#558b2f',
  C: '#f57f17',
  D: '#e65100',
  E: '#c62828',
};

/** @type {Record<string, string>} */
export const GRADE_LABELS = {
  A: 'Excellent',
  B: 'Good',
  C: 'Moderate',
  D: 'Poor',
  E: 'High Tax Drag',
};

/** Ordered list used by the grade-threshold section in ScoreBreakdownDialog. */
export const GRADE_ROWS = [
  { grade: 'A', min: 80, label: 'Excellent' },
  { grade: 'B', min: 60, label: 'Good' },
  { grade: 'C', min: 40, label: 'Moderate' },
  { grade: 'D', min: 20, label: 'Poor' },
  { grade: 'E', min: 0,  label: 'High Tax Drag' },
];

/**
 * Maps a 0-100 score to the same green → red colour palette as the grade badge.
 * @param {number} score
 * @returns {string} hex colour
 */
export const scoreToColor = (score) => {
  if (score >= 80) return GRADE_COLORS.A;
  if (score >= 60) return GRADE_COLORS.B;
  if (score >= 40) return GRADE_COLORS.C;
  if (score >= 20) return GRADE_COLORS.D;
  return GRADE_COLORS.E;
};

