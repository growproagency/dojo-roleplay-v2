const RUBRIC_WEIGHTS = {
  inbound: [10, 20, 20, 20, 20, 10],
  outbound: [20, 20, 15, 20, 15, 10],
  salesEnrollment: [25, 20, 15, 15, 15, 10],
  renewal: [15, 30, 20, 20, 10, 5],
  cancellation: [20, 25, 25, 15, 15],
};

function roundScore(score) {
  return Math.round(score * 10) / 10;
}

function clampScore(score, min, max) {
  const value = Number(score);
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, value));
}

export function normalizeOverallScore(score) {
  const clamped = clampScore(score, 0, 100);
  if (clamped == null) return null;
  return roundScore(clamped <= 10 ? clamped * 10 : clamped);
}

export function getRubricType(scenarioTitle) {
  const title = String(scenarioTitle || '').toLowerCase();
  if (title.includes('cancellation')) return 'cancellation';
  if (title.includes('renewal')) return 'renewal';
  if (title.includes('enrollment') || title.includes('conference')) return 'salesEnrollment';
  if (title.includes('outbound') || title.includes('callback')) return 'outbound';
  return 'inbound';
}

export function calculateWeightedOverallScore(categories, scenarioTitle) {
  const weights = RUBRIC_WEIGHTS[getRubricType(scenarioTitle)];
  return calculateWeightedOverallScoreWithWeights(categories, weights);
}

export function calculateWeightedOverallScoreWithWeights(categories, weights) {
  if (!Array.isArray(categories) || categories.length < weights.length) return null;
  const totalWeight = weights.reduce((sum, weight) => sum + Number(weight || 0), 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return null;

  const weighted = weights.reduce((sum, weight, index) => {
    const categoryScore = clampScore(categories[index]?.score, 0, 10);
    if (categoryScore == null) return NaN;
    return sum + categoryScore * weight;
  }, 0);

  if (!Number.isFinite(weighted)) return null;
  return roundScore((weighted / totalWeight) * 10);
}

export function calculateWeightedOverallScoreFromCategories(categories, scoringCategories) {
  if (!Array.isArray(scoringCategories) || scoringCategories.length === 0) return null;
  const weights = scoringCategories.map((category) => Number(category?.weight));
  if (weights.some((weight) => !Number.isFinite(weight))) return null;
  return calculateWeightedOverallScoreWithWeights(categories, weights);
}

export function calculateAverageOverallScore(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  const scores = categories.map((category) => clampScore(category?.score, 0, 10));
  if (scores.some((score) => score == null)) return null;

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return roundScore(average * 10);
}

export function resolveOverallScore({ overallScore, categories, scenarioTitle, customScoringPrompt, scoringCategories }) {
  if (!customScoringPrompt) {
    const customWeights = calculateWeightedOverallScoreFromCategories(categories, scoringCategories);
    if (customWeights != null) return customWeights;

    const calculated = calculateWeightedOverallScore(categories, scenarioTitle);
    if (calculated != null) return calculated;
  }

  const customCategoryAverage = calculateAverageOverallScore(categories);
  if (customCategoryAverage != null) return customCategoryAverage;

  return normalizeOverallScore(overallScore);
}
