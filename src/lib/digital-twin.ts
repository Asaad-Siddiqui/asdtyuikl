/**
 * Digital Twin engine.
 *
 * A pure, client-safe model of how weather propagates through the entities the
 * Travello/Wayfare solution already manages — destinations, their attractions,
 * stays and transport. It does not replace the catalogue; it *simulates* it.
 *
 * Design:
 *   weather conditions → a severity vector → direct effects on demand,
 *   movement, capacity and operations → cascading (second/third-order) effects
 *   on crowding, availability, sustainability and accessibility risk → a set of
 *   probabilistic predictions with explicit uncertainty bands.
 *
 * Everything is deterministic, so the same scenario always yields the same
 * state — the what-if simulator can be trusted to be reproducible, and the
 * numbers can always be traced back to a documented formula.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type TwinConditions = {
  /** Rain intensity in mm/h. */
  rainfallMm: number;
  /** Air temperature in °C. */
  tempC: number;
  /** Wind speed in km/h. */
  windKph: number;
  /** How long the severe weather lasts, in hours. */
  durationHours: number;
};

export type TwinAccessibility = {
  stepFreeRoutes: boolean;
  lowWalkingRequirement: boolean;
  accessibleToilets: boolean;
  wheelchairAccessible: boolean;
  elevator: boolean;
  accessibleParking: boolean;
  trailDifficulty: string;
};

export type TwinEntity = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  sustainabilityScore: number;
  crowdLevel: string;
  visitorPressure: string;
  environmentalSensitivity: string;
  accessibility: TwinAccessibility;
  tags: string[];
};

export type TwinMetricKey =
  | "outdoorDemand"
  | "indoorDemand"
  | "movement"
  | "capacity"
  | "operations"
  | "availability"
  | "crowdPressure"
  | "sustainabilityRisk"
  | "accessibilityRisk";

export type TwinMetric = {
  key: TwinMetricKey;
  label: string;
  /** 0–100 index under the simulated conditions. */
  value: number;
  /** 0–100 index under calm conditions. */
  baseline: number;
  direction: "up" | "down" | "steady";
  description: string;
};

export type TwinPropagation = {
  /** 1 = direct, 2 = secondary, 3 = higher-order. */
  order: 1 | 2 | 3;
  from: string;
  to: string;
  effect: string;
  /** 0–1 strength of this link. */
  magnitude: number;
};

export type TwinPrediction = {
  label: string;
  /** Lower bound of the estimate. */
  low: number;
  /** Upper bound of the estimate. */
  high: number;
  unit: string;
  direction: "up" | "down";
  /** 0–1 confidence; falls as severity rises. */
  confidence: number;
};

export type TwinState = {
  entityId: string;
  entityName: string;
  severity: number;
  status: "Normal" | "Watch" | "Disrupted" | "Severe";
  headline: string;
  /** 0–100 combined impact, used to colour the map. */
  impact: number;
  weatherAdjustedCrowd: string;
  metrics: TwinMetric[];
  propagation: TwinPropagation[];
  predictions: TwinPrediction[];
  recommendations: string[];
  updatedAt: string;
};

/* ------------------------------------------------------------------ */
/* Scenario presets                                                    */
/* ------------------------------------------------------------------ */

export type ScenarioPreset = {
  key: string;
  label: string;
  description: string;
  conditions: TwinConditions;
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    key: "normal",
    label: "Normal",
    description: "Calm baseline — mild temperature, little rain.",
    conditions: { rainfallMm: 0, tempC: 27, windKph: 10, durationHours: 0 },
  },
  {
    key: "monsoon",
    label: "Monsoon downpour",
    description: "Sustained heavy rain — the classic Western Ghats scenario.",
    conditions: { rainfallMm: 38, tempC: 24, windKph: 35, durationHours: 18 },
  },
  {
    key: "heatwave",
    label: "Heatwave",
    description: "Extreme heat with high humidity.",
    conditions: { rainfallMm: 0, tempC: 42, windKph: 12, durationHours: 24 },
  },
  {
    key: "cyclone",
    label: "Cyclone",
    description: "Storm-force wind and torrential rain over a long window.",
    conditions: { rainfallMm: 65, tempC: 26, windKph: 95, durationHours: 36 },
  },
  {
    key: "cold_snap",
    label: "Cold snap",
    description: "Sharp cold with mountain wind chill.",
    conditions: { rainfallMm: 4, tempC: -2, windKph: 40, durationHours: 20 },
  },
];

export const DEFAULT_SCENARIO: TwinConditions = SCENARIO_PRESETS[0].conditions;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));
const clamp01 = (value: number) => clamp(value, 0, 1);
const round = (value: number) => Math.round(value * 10) / 10;

const CROWD_RANK: Record<string, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  "Very High": 3,
};

const CROWD_LADDER = ["Low", "Medium", "High", "Very High"];

/** Terrain behaviour inferred from the catalogue tags. */
function terrainProfile(entity: TwinEntity) {
  const tags = entity.tags.map((tag) => tag.toLowerCase()).join(" ");
  const isCoastal = /beach|coastal|island|backwater/.test(tags);
  const isMountain = /mountain|snow|alpine|himalaya/.test(tags);
  const isHill = /hill|forest|walking|railway/.test(tags);
  const isPlantation = /tea|plantation|spice|gardens/.test(tags);

  return {
    floodSensitivity: isCoastal ? 0.9 : isMountain ? 0.5 : isHill ? 0.45 : isPlantation ? 0.55 : 0.4,
    slopeSensitivity: isMountain ? 0.9 : isHill ? 0.8 : isPlantation ? 0.55 : isCoastal ? 0.15 : 0.4,
    heatSensitivity: isCoastal ? 0.85 : isHill ? 0.5 : isMountain ? 0.4 : 0.6,
    coldSensitivity: isMountain ? 0.95 : isHill ? 0.6 : 0.1,
    rainAppeal: isPlantation || isHill ? 0.7 : isCoastal ? 0.3 : 0.4,
  };
}

/** 0–100 accessibility score from the stored booleans (same weights as the catalogue). */
function accessibilityScore(entity: TwinEntity): number {
  let score = 0;
  if (entity.accessibility.stepFreeRoutes) score += 30;
  if (entity.accessibility.lowWalkingRequirement) score += 25;
  if (entity.accessibility.accessibleToilets) score += 15;
  if (entity.accessibility.wheelchairAccessible) score += 12;
  if (entity.accessibility.elevator) score += 10;
  if (entity.accessibility.accessibleParking) score += 8;
  const difficulty = entity.accessibility.trailDifficulty?.toLowerCase() ?? "";
  if (difficulty === "easy") score += 5;
  else if (difficulty === "difficult") score -= 15;
  return clamp(score);
}

/* ------------------------------------------------------------------ */
/* Severity vector                                                     */
/* ------------------------------------------------------------------ */

export type SeverityVector = {
  rain: number;
  wind: number;
  heat: number;
  cold: number;
  duration: number;
  peak: number;
  overall: number;
};

export function weatherSeverity(
  conditions: TwinConditions,
  entity: TwinEntity,
): SeverityVector {
  const terrain = terrainProfile(entity);

  const rain = clamp01(conditions.rainfallMm / 40);
  const wind = clamp01(conditions.windKph / 70);
  const heat = clamp01((conditions.tempC - 33) / 8) * (0.6 + terrain.heatSensitivity * 0.6);
  const cold = clamp01((8 - conditions.tempC) / 12) * (0.6 + terrain.coldSensitivity * 0.6);
  const duration = clamp01(conditions.durationHours / 24);

  const peak = Math.max(rain, wind, heat, cold);
  const overall = clamp01(peak * 0.7 + duration * 0.3);

  return {
    rain,
    wind,
    heat: clamp01(heat),
    cold: clamp01(cold),
    duration,
    peak,
    overall,
  };
}

/* ------------------------------------------------------------------ */
/* Metric computation                                                  */
/* ------------------------------------------------------------------ */

type MetricSet = Record<TwinMetricKey, number>;

function computeMetrics(entity: TwinEntity, conditions: TwinConditions): {
  metrics: MetricSet;
  severity: SeverityVector;
} {
  const severity = weatherSeverity(conditions, entity);
  const terrain = terrainProfile(entity);
  const baseCrowd = (CROWD_RANK[entity.crowdLevel] ?? 1) / 3; // 0–1
  const basePressure = (CROWD_RANK[entity.visitorPressure] ?? 1) / 3;
  const accScore = accessibilityScore(entity);
  const baseAccessibilityRisk = (1 - accScore / 100) * 60;

  const flood = clamp01(
    severity.rain * terrain.floodSensitivity * 0.7 +
      severity.duration * terrain.floodSensitivity * 0.3,
  );

  // 1. Outdoor attractions lose appeal in bad weather; milder places gain a little in rain.
  const outdoorDemand = clamp(
    72 * (1 - 0.85 * severity.rain - 0.5 * severity.heat - 0.4 * severity.cold - 0.3 * severity.wind) +
      terrain.rainAppeal * 12 * severity.rain,
  );

  // 2. Indoor demand absorbs the crowd displaced from outdoors.
  const indoorDemand = clamp(
    40 * (1 + 0.9 * severity.rain + 0.5 * severity.heat + 0.5 * severity.cold),
  );

  // 3. Movement/travel ease — rain on slopes and wind hurt most.
  const movement = clamp(
    100 *
      (1 -
        0.55 * severity.rain * terrain.floodSensitivity -
        0.35 * severity.rain * terrain.slopeSensitivity -
        0.5 * severity.wind -
        0.1 * severity.heat),
  );

  // 4. Usable capacity — flooding and wind damage reduce it.
  const capacity = clamp(
    100 * (1 - 0.55 * flood - 0.35 * severity.wind - 0.2 * severity.duration),
  );

  // 5. Operations / workforce availability.
  const operations = clamp(
    100 * (1 - 0.45 * severity.overall - 0.25 * severity.duration - 0.15 * severity.wind),
  );

  // 6. Stay/transport availability — follows movement and capacity, lagged.
  const availability = clamp(
    100 * (1 - 0.45 * (1 - movement / 100) - 0.35 * (1 - capacity / 100)),
  );

  // 7. Crowd pressure — displaced people concentrate in what stays open.
  const crowdPressure = clamp(
    (baseCrowd * 0.7 + basePressure * 0.3) * 100 *
      (1 + 0.5 * severity.rain + 0.3 * severity.heat + 0.3 * severity.cold),
  );

  // 8. Sustainability risk — waste/water/erosion strain.
  const sensitivityRank =
    entity.environmentalSensitivity === "High"
      ? 1
      : entity.environmentalSensitivity === "Medium"
        ? 0.6
        : 0.3;
  const sustainabilityRisk = clamp(
    sensitivityRank * 55 + flood * 30 + severity.duration * 15,
  );

  // 9. Accessibility risk — wet/steep/cold conditions degrade step-free travel.
  const accessibilityRisk = clamp(
    baseAccessibilityRisk +
      severity.rain * terrain.slopeSensitivity * 45 +
      severity.cold * 20 +
      flood * 15,
  );

  return {
    severity,
    metrics: {
      outdoorDemand,
      indoorDemand,
      movement,
      capacity,
      operations,
      availability,
      crowdPressure,
      sustainabilityRisk,
      accessibilityRisk,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Status + forecast                                                   */
/* ------------------------------------------------------------------ */

function statusFor(severity: number): TwinState["status"] {
  if (severity < 0.2) return "Normal";
  if (severity < 0.45) return "Watch";
  if (severity < 0.7) return "Disrupted";
  return "Severe";
}

const METRIC_META: Record<
  TwinMetricKey,
  { label: string; describe: (up: boolean) => string }
> = {
  outdoorDemand: {
    label: "Outdoor attraction demand",
    describe: (up) => (up ? "More people heading outdoors" : "Fewer people heading outdoors"),
  },
  indoorDemand: {
    label: "Indoor attraction demand",
    describe: (up) => (up ? "Indoor venues absorb displaced crowds" : "Less pressure on indoor venues"),
  },
  movement: {
    label: "Movement & travel ease",
    describe: (up) => (up ? "Easier to move around" : "Slower, harder movement"),
  },
  capacity: {
    label: "Usable capacity",
    describe: (up) => (up ? "Capacity holding up" : "Capacity constrained"),
  },
  operations: {
    label: "Operations & staffing",
    describe: (up) => (up ? "Operations running normally" : "Operations under strain"),
  },
  availability: {
    label: "Stay & transport availability",
    describe: (up) => (up ? "Availability healthy" : "Tighter availability"),
  },
  crowdPressure: {
    label: "Crowd pressure",
    describe: (up) => (up ? "Crowds concentrating" : "Crowds dispersing"),
  },
  sustainabilityRisk: {
    label: "Sustainability risk",
    describe: (up) => (up ? "Higher waste/water/erosion strain" : "Lower environmental strain"),
  },
  accessibilityRisk: {
    label: "Accessibility risk",
    describe: (up) => (up ? "Step-free travel harder" : "Step-free travel easier"),
  },
};

const CALM: TwinConditions = { rainfallMm: 0, tempC: 26, windKph: 8, durationHours: 0 };

/* ------------------------------------------------------------------ */
/* The simulator                                                       */
/* ------------------------------------------------------------------ */

/**
 * Simulates one entity under a set of weather conditions. Pure and
 * deterministic — the same inputs always produce the same twin state.
 */
export function simulateTwin(
  entity: TwinEntity,
  conditions: TwinConditions,
): TwinState {
  const simulated = computeMetrics(entity, conditions);
  const calm = computeMetrics(entity, CALM);

  const metrics: TwinMetric[] = (Object.keys(METRIC_META) as TwinMetricKey[]).map(
    (key) => {
      const value = round(simulated.metrics[key]);
      const baseline = round(calm.metrics[key]);
      const delta = value - baseline;
      const direction: TwinMetric["direction"] =
        Math.abs(delta) < 2 ? "steady" : delta > 0 ? "up" : "down";
      return {
        key,
        label: METRIC_META[key].label,
        value,
        baseline,
        direction,
        description: METRIC_META[key].describe(direction === "up"),
      };
    },
  );

  const severity = simulated.severity;
  const m = simulated.metrics;

  // ---- Cascading propagation (direct → secondary → higher-order) ------
  const propagation: TwinPropagation[] = [];

  if (severity.rain > 0.2 || severity.wind > 0.2 || severity.heat > 0.2 || severity.cold > 0.2) {
    propagation.push({
      order: 1,
      from: "Weather",
      to: "Outdoor demand",
      effect: `${entity.name}: adverse weather cuts outdoor attraction demand to ${round(
        m.outdoorDemand,
      )}/100 (from ${round(calm.metrics.outdoorDemand)}).`,
      magnitude: clamp01(1 - m.outdoorDemand / Math.max(1, calm.metrics.outdoorDemand)),
    });
    propagation.push({
      order: 1,
      from: "Weather",
      to: "Movement",
      effect: `Travel ease drops to ${round(m.movement)}/100 as rain, wind and terrain slow movement.`,
      magnitude: clamp01(1 - m.movement / Math.max(1, calm.metrics.movement)),
    });
  }

  if (m.indoorDemand > calm.metrics.indoorDemand + 5) {
    propagation.push({
      order: 2,
      from: "Outdoor demand",
      to: "Indoor demand",
      effect: `Displaced visitors shift to indoor venues — indoor demand rises to ${round(
        m.indoorDemand,
      )}/100.`,
      magnitude: clamp01((m.indoorDemand - calm.metrics.indoorDemand) / 100),
    });
  }

  if (m.crowdPressure > calm.metrics.crowdPressure + 5) {
    propagation.push({
      order: 2,
      from: "Indoor shift",
      to: "Crowd pressure",
      effect: `Crowds concentrate in what stays open — crowd pressure climbs to ${round(
        m.crowdPressure,
      )}/100.`,
      magnitude: clamp01((m.crowdPressure - calm.metrics.crowdPressure) / 100),
    });
  }

  if (m.accessibilityRisk > calm.metrics.accessibilityRisk + 3) {
    propagation.push({
      order: 2,
      from: "Rain & terrain",
      to: "Accessibility",
      effect: `Wet, sloped ground raises accessibility risk to ${round(
        m.accessibilityRisk,
      )}/100 — step-free routes need checking.`,
      magnitude: clamp01((m.accessibilityRisk - calm.metrics.accessibilityRisk) / 100),
    });
  }

  if (m.capacity < calm.metrics.capacity - 5) {
    propagation.push({
      order: 3,
      from: "Flooding & wind",
      to: "Capacity",
      effect: `Sustained weather erodes usable capacity to ${round(m.capacity)}/100, tightening stays and services.`,
      magnitude: clamp01((calm.metrics.capacity - m.capacity) / 100),
    });
  }

  if (m.availability < calm.metrics.availability - 5) {
    propagation.push({
      order: 3,
      from: "Movement & capacity",
      to: "Availability",
      effect: `Stay and transport availability falls to ${round(
        m.availability,
      )}/100 as delays cascade.`,
      magnitude: clamp01((calm.metrics.availability - m.availability) / 100),
    });
  }

  if (m.sustainabilityRisk > calm.metrics.sustainabilityRisk + 5) {
    propagation.push({
      order: 3,
      from: "Flooding",
      to: "Sustainability",
      effect: `Waste, water and erosion strain rises to ${round(
        m.sustainabilityRisk,
      )}/100 in this sensitive (${entity.environmentalSensitivity.toLowerCase()}) habitat.`,
      magnitude: clamp01((m.sustainabilityRisk - calm.metrics.sustainabilityRisk) / 100),
    });
  }

  // ---- Probabilistic predictions with uncertainty ---------------------
  const uncertainty = clamp01(0.12 + 0.28 * severity.overall);
  const confidence = round((1 - uncertainty) * 100) / 100;

  const outdoorChange = pct(calm.metrics.outdoorDemand, m.outdoorDemand);
  const indoorChange = pct(calm.metrics.indoorDemand, m.indoorDemand);
  const movementChange = pct(calm.metrics.movement, m.movement);
  const availabilityChange = pct(calm.metrics.availability, m.availability);

  const predictions: TwinPrediction[] = [
    band("Outdoor visitor footfall", outdoorChange, "%", "down", uncertainty, confidence),
    band("Indoor venue demand", indoorChange, "%", "up", uncertainty, confidence),
    band("On-time arrivals", movementChange, "%", "down", uncertainty, confidence),
    band("Stay availability", availabilityChange, "%", "down", uncertainty, confidence),
  ];

  // ---- Headline + status ---------------------------------------------
  const status = statusFor(severity.overall);
  const worst = [...metrics].sort(
    (a, b) => Math.abs(b.value - b.baseline) - Math.abs(a.value - a.baseline),
  )[0];
  const headline =
    status === "Normal"
      ? `${entity.name} is behaving normally — conditions are calm.`
      : `${entity.name}: ${describeWorst(worst)} under these conditions.`;

  // ---- Weather-adjusted crowd band -----------------------------------
  const crowdIndex =
    (CROWD_RANK[entity.crowdLevel] ?? 1) +
    (severity.rain > 0.35 || severity.heat > 0.5 ? 1 : 0);
  const weatherAdjustedCrowd =
    CROWD_LADDER[Math.min(CROWD_LADDER.length - 1, Math.max(0, crowdIndex))];

  // ---- Recommendations — tied back into the existing features --------
  const recommendations: string[] = [];
  if (m.movement < 60) {
    recommendations.push(
      "Shift outdoor stops indoors and lean on Senior + Accessibility mode picks — step-free, low-walking venues.",
    );
  }
  if (m.crowdPressure > 60) {
    recommendations.push(
      "Crowds concentrate in what stays open — use Crowd-Aware Picks and travel in the calmest window.",
    );
  }
  if (m.accessibilityRisk > 55) {
    recommendations.push(
      "Check step-free routes on the destination hub before leaving; wet, sloped paths can slip.",
    );
  }
  if (m.sustainabilityRisk > 65) {
    recommendations.push(
      "Prefer less-crowded alternatives on higher, well-drained ground to reduce erosion and waste strain.",
    );
  }
  if (severity.overall > 0.4) {
    recommendations.push(
      "Travelling as a group shares transport and splits weather risk — see Travel Together on your trip.",
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Conditions are stable — a good day for the recommended itinerary.",
    );
  }

  const impact = round(
    clamp(severity.overall * 70 + (1 - m.movement / 100) * 30),
  );

  return {
    entityId: entity.id,
    entityName: entity.name,
    severity: round(severity.overall * 100) / 100,
    status,
    headline,
    impact,
    weatherAdjustedCrowd,
    metrics,
    propagation,
    predictions,
    recommendations,
    updatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Small utilities                                                     */
/* ------------------------------------------------------------------ */

function pct(baseline: number, value: number): number {
  if (baseline <= 0) return 0;
  return round(((value - baseline) / baseline) * 100);
}

function band(
  label: string,
  mean: number,
  unit: string,
  direction: "up" | "down",
  uncertainty: number,
  confidence: number,
): TwinPrediction {
  const spread = Math.abs(mean) * uncertainty + 2;
  return {
    label,
    low: round(mean - spread),
    high: round(mean + spread),
    unit,
    direction,
    confidence,
  };
}

function describeWorst(metric: TwinMetric): string {
  const delta = Math.round(metric.value - metric.baseline);
  const sign = delta > 0 ? "+" : "";
  return `${metric.label.toLowerCase()} ${sign}${delta} points`;
}

/** Impact across a whole set of entities — used for the map summary. */
export function twinSummary(states: TwinState[]) {
  if (states.length === 0) {
    return { averageImpact: 0, worst: null as TwinState | null, affected: 0 };
  }
  const averageImpact = round(
    states.reduce((sum, state) => sum + state.impact, 0) / states.length,
  );
  const worst = [...states].sort((a, b) => b.impact - a.impact)[0];
  const affected = states.filter((state) => state.status !== "Normal").length;
  return { averageImpact, worst, affected };
}
