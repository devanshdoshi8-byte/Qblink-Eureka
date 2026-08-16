/**
 * Rolling Service Velocity Wait Time Engine
 *
 * Replaces naive static multiplication (ahead * serviceTime) with an adaptive,
 * outlier-resistant service velocity model that continuously updates as visitors
 * are served at the counter.
 *
 * Mathematical properties:
 *  - Outlier rejection: Rejects anomaly service times (< 0.3x or > 3.0x historical).
 *  - Bayesian-inspired historical anchor: Blends recent rolling observations with historical baseline.
 *  - Confidence indicator: Scales [0, 100] based on sample size and velocity variance.
 *  - Non-zero monotonic bounds: Never produces negative or zero wait when ahead > 0.
 */

export interface CompletedServiceSample {
  id?: string;
  joinedAt: string | number;
  calledAt?: string | number | null;
  servedAt: string | number;
  durationMinutes?: number;
}

export interface VelocityEngineConfig {
  /** Maximum samples to keep in the rolling window (default: 5, range: 3-10) */
  rollingWindowSize?: number;
  /** Minimum acceptable ratio of historical time (default: 0.3) */
  minOutlierRatio?: number;
  /** Maximum acceptable ratio of historical time (default: 3.0) */
  maxOutlierRatio?: number;
  /** Maximum weight given to recent samples vs historical baseline (default: 0.75) */
  maxRecentWeight?: number;
}

export interface VelocityWaitResult {
  /** The recommended estimated wait in whole minutes */
  estimatedMinutes: number;
  /** The effective service velocity (minutes per customer) */
  effectiveVelocity: number;
  /** Confidence score between 0 and 100 */
  confidenceScore: number;
  /** Number of valid recent completed samples used */
  sampleCount: number;
  /** Number of outliers excluded */
  outliersExcluded: number;
  /** Historical baseline wait time (ahead * historicalDefault) */
  baselineWaitMinutes: number;
  /** Lower and upper bounds of the prediction */
  range: {
    minMinutes: number;
    maxMinutes: number;
  };
}

/**
 * Extract duration in minutes from a completed visit record.
 */
export function extractServiceDuration(sample: CompletedServiceSample): number | null {
  if (typeof sample.durationMinutes === "number" && Number.isFinite(sample.durationMinutes) && sample.durationMinutes > 0) {
    return sample.durationMinutes;
  }
  const servedTime = new Date(sample.servedAt).getTime();
  const startTime = sample.calledAt ? new Date(sample.calledAt).getTime() : new Date(sample.joinedAt).getTime();

  if (Number.isNaN(servedTime) || Number.isNaN(startTime) || servedTime <= startTime) {
    return null;
  }

  const durationMin = (servedTime - startTime) / 60000;
  return Number.isFinite(durationMin) && durationMin > 0 && durationMin < 480 ? durationMin : null;
}

/**
 * Calculate dynamic rolling service velocity and predicted wait time.
 */
export function calculateRollingVelocityWait({
  aheadCount,
  historicalServiceTime = 5,
  recentCompletedSamples = [],
  config = {},
}: {
  aheadCount: number;
  historicalServiceTime?: number;
  recentCompletedSamples?: CompletedServiceSample[];
  config?: VelocityEngineConfig;
}): VelocityWaitResult {
  const windowSize = Math.max(3, Math.min(10, config.rollingWindowSize ?? 5));
  const minRatio = config.minOutlierRatio ?? 0.3;
  const maxRatio = config.maxOutlierRatio ?? 3.0;
  const maxWeight = config.maxRecentWeight ?? 0.75;

  const baselineTime = Math.max(1, historicalServiceTime || 5);
  const baselineWait = aheadCount * baselineTime;

  if (aheadCount <= 0) {
    return {
      estimatedMinutes: 0,
      effectiveVelocity: baselineTime,
      confidenceScore: 100,
      sampleCount: 0,
      outliersExcluded: 0,
      baselineWaitMinutes: 0,
      range: { minMinutes: 0, maxMinutes: 0 },
    };
  }

  // Extract and filter valid durations
  const validDurations: number[] = [];
  let outliersCount = 0;

  for (const sample of recentCompletedSamples.slice(-windowSize * 2)) {
    const dur = extractServiceDuration(sample);
    if (dur === null) continue;

    // Outlier filter: reject extreme values compared to baseline
    const minAcceptable = baselineTime * minRatio;
    const maxAcceptable = baselineTime * maxRatio;

    if (dur < minAcceptable || dur > maxAcceptable) {
      outliersCount++;
    } else {
      validDurations.push(dur);
    }

    if (validDurations.length >= windowSize) break;
  }

  const samplesUsed = validDurations.length;

  if (samplesUsed === 0) {
    // Zero recent completed samples: fallback 100% to baseline
    return {
      estimatedMinutes: Math.max(1, Math.round(baselineWait)),
      effectiveVelocity: baselineTime,
      confidenceScore: 50,
      sampleCount: 0,
      outliersExcluded: outliersCount,
      baselineWaitMinutes: Math.round(baselineWait),
      range: {
        minMinutes: Math.max(1, Math.round(aheadCount * (baselineTime * 0.8))),
        maxMinutes: Math.round(aheadCount * (baselineTime * 1.25)),
      },
    };
  }

  // Calculate exponential/linear weighted mean of recent valid durations
  // (most recent sample receives higher weighting)
  let weightedSum = 0;
  let weightSum = 0;
  validDurations.forEach((dur, idx) => {
    const weight = 1 + idx * 0.25;
    weightedSum += dur * weight;
    weightSum += weight;
  });
  const recentVelocity = weightedSum / weightSum;

  // Adaptive weight factor: scale towards maxWeight as sample count reaches windowSize
  const sampleWeightFactor = Math.min(1, samplesUsed / windowSize) * maxWeight;

  // Blended service velocity
  const effectiveVelocity = sampleWeightFactor * recentVelocity + (1 - sampleWeightFactor) * baselineTime;

  // Compute variance for confidence calculation
  const mean = validDurations.reduce((a, b) => a + b, 0) / samplesUsed;
  const variance = validDurations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / samplesUsed;
  const standardDeviation = Math.sqrt(variance);

  // Confidence calculation (higher samples & lower variance = higher confidence)
  const sampleConfidence = (samplesUsed / windowSize) * 40;
  const consistencyBonus = Math.max(0, 40 - (standardDeviation / baselineTime) * 30);
  const confidenceScore = Math.min(98, Math.max(45, Math.round(20 + sampleConfidence + consistencyBonus)));

  const rawEstimatedWait = aheadCount * effectiveVelocity;
  const estimatedMinutes = Math.max(1, Math.round(rawEstimatedWait));

  // Predictive interval bounds (90% interval based on standard deviation)
  const spreadMargin = Math.max(1, Math.round(aheadCount * (standardDeviation || baselineTime * 0.25)));
  const minMinutes = Math.max(1, estimatedMinutes - spreadMargin);
  const maxMinutes = estimatedMinutes + spreadMargin;

  return {
    estimatedMinutes,
    effectiveVelocity: Math.round(effectiveVelocity * 10) / 10,
    confidenceScore,
    sampleCount: samplesUsed,
    outliersExcluded: outliersCount,
    baselineWaitMinutes: Math.round(baselineWait),
    range: {
      minMinutes,
      maxMinutes,
    },
  };
}
