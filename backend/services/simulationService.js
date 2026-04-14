/**
 * SmartVenue AI — Advanced Simulation Service
 *
 * Realistic crowd simulation with:
 * - Time-of-day based crowd patterns (morning rush, peak hours, evening wind-down)
 * - Sector momentum (density changes gradually, not randomly)
 * - Density → Wait time formula (queuing theory approximation)
 * - 15-minute predictive trend projection
 * - AI-generated contextual alerts & insights
 */

const sectors = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

// Sector configuration: base capacity and zone type
const SECTOR_CONFIG = {
  A1: { capacity: 500, zone: 'Entry Gate', baseActivity: 0.9 },
  A2: { capacity: 400, zone: 'Entry Gate', baseActivity: 0.85 },
  A3: { capacity: 600, zone: 'Main Stage', baseActivity: 0.95 },
  A4: { capacity: 550, zone: 'Main Stage', baseActivity: 0.9 },
  B1: { capacity: 300, zone: 'Food Court', baseActivity: 0.8 },
  B2: { capacity: 300, zone: 'Food Court', baseActivity: 0.75 },
  B3: { capacity: 350, zone: 'Entertainment', baseActivity: 0.7 },
  B4: { capacity: 350, zone: 'Entertainment', baseActivity: 0.65 },
  C1: { capacity: 200, zone: 'Restrooms', baseActivity: 0.5 },
  C2: { capacity: 200, zone: 'Restrooms', baseActivity: 0.5 },
  C3: { capacity: 450, zone: 'VIP Lounge', baseActivity: 0.4 },
  C4: { capacity: 250, zone: 'Exit Gate', baseActivity: 0.6 },
};

const FACILITIES = [
  { name: 'Main Gate',    baseCap: 120, zone: 'Entry' },
  { name: 'Food Court',   baseCap: 80,  zone: 'Dining' },
  { name: 'Restrooms',    baseCap: 40,  zone: 'Amenity' },
  { name: 'VIP Entrance', baseCap: 30,  zone: 'VIP' },
  { name: 'Main Stage',   baseCap: 500, zone: 'Event' },
];

// Persistent state — density changes gradually via momentum
const state = {
  densities: Object.fromEntries(sectors.map(s => [s, 40 + Math.random() * 30])),
  momentum: Object.fromEntries(sectors.map(s => [s, (Math.random() - 0.5) * 2])),
  tick: 0,
};

/**
 * Time-of-day multiplier (0–1 scale)
 * Simulates realistic event-day crowd patterns.
 */
const getTimeMultiplier = () => {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const t = hour + minute / 60;

  // Pre-event trickle (6–10am)
  if (t >= 6 && t < 10) return 0.2 + 0.08 * (t - 6);
  // Morning build-up (10am–1pm)
  if (t >= 10 && t < 13) return 0.5 + 0.15 * (t - 10);
  // Peak hours (1pm–6pm)
  if (t >= 13 && t < 18) return 0.85 + 0.03 * Math.sin((t - 13) * Math.PI);
  // Evening surge (6pm–9pm)
  if (t >= 18 && t < 21) return 0.8 - 0.1 * (t - 18);
  // Wind-down (9pm–midnight)
  if (t >= 21 && t < 24) return 0.5 - 0.15 * (t - 21);
  // Overnight (0–6am)
  return 0.05;
};

/**
 * Density → wait time using a queuing-theory inspired formula.
 * Based on M/M/1 queue approximation:
 *   rho = density/100 (utilization)
 *   W = 1 / (mu * (1 - rho)) — scaled to minutes
 */
const densityToWaitTime = (density, capacity) => {
  const rho = Math.min(density / 100, 0.97); // utilization (capped to avoid infinity)
  const mu = capacity / 10;                  // service rate (arbitrary units)
  const rawWait = 1 / (mu * (1 - rho));
  // Scale to human-readable minutes range [0–60]
  return Math.round(Math.min(rawWait * 200, 60));
};

/**
 * Predict density in ~15 minutes using current momentum.
 * Simple linear projection with a regression-to-mean dampener.
 */
const predictDensity = (current, momentum, timeMul) => {
  const steps = 5; // 5 ticks ≈ 15 seconds ahead per tick, loosely "15 min"
  const mean = 50 * timeMul;
  let predicted = current;
  let m = momentum;
  for (let i = 0; i < steps; i++) {
    const pullToMean = (mean - predicted) * 0.05;
    m = m * 0.9 + pullToMean + (Math.random() - 0.5) * 1.5;
    predicted = Math.max(5, Math.min(100, predicted + m));
  }
  return Math.round(predicted);
};

/**
 * Generate zone-aware AI insight based on current state.
 */
const generateInsights = (heatmap, predictions, queues) => {
  const insights = [];

  // Find most congested sector
  const sortedByDensity = Object.entries(heatmap).sort((a, b) => b[1] - a[1]);
  const [topSector, topDensity] = sortedByDensity[0];
  const topConfig = SECTOR_CONFIG[topSector];

  if (topDensity > 80) {
    insights.push({
      level: 'critical',
      message: `🔴 CRITICAL: ${topConfig.zone} (${topSector}) at ${topDensity}% capacity. Immediate crowd management required.`,
    });
  } else if (topDensity > 60) {
    insights.push({
      level: 'warning',
      message: `⚠️ ${topConfig.zone} (${topSector}) is approaching capacity at ${topDensity}%. Consider rerouting attendees.`,
    });
  }

  // Trend-based insights
  const trending = sectors.filter(s => {
    const current = heatmap[s];
    const predicted = predictions[s];
    return predicted - current > 10;
  });

  if (trending.length > 0) {
    const zones = trending.slice(0, 2).map(s => SECTOR_CONFIG[s].zone);
    const uniqueZones = [...new Set(zones)];
    insights.push({
      level: 'info',
      message: `📈 Rising trend detected in ${uniqueZones.join(' & ')}. Predicted +${Math.round(trending.length * 8)}% occupancy in next 15 minutes.`,
    });
  }

  // Queue-based insights
  const longestQueue = queues.reduce((a, b) => a.waitTime > b.waitTime ? a : b, queues[0]);
  if (longestQueue && longestQueue.waitTime > 25) {
    insights.push({
      level: 'warning',
      message: `🕐 ${longestQueue.name} wait time is ${longestQueue.waitTime} minutes. Open additional service points to reduce congestion.`,
    });
  }

  // Safe path insight
  const sortedSafe = [...sectors].sort((a, b) => heatmap[a] - heatmap[b]);
  const safePath = sortedSafe.slice(0, 3);
  insights.push({
    level: 'success',
    message: `✅ Optimal route: ${safePath.join(' → ')} — all sectors below ${Math.round(Math.max(...safePath.map(s => heatmap[s])))}% capacity.`,
  });

  return insights;
};

/**
 * Main tick function — updates state and produces a full simulation snapshot.
 */
const generateSimulationData = () => {
  state.tick++;
  const timeMul = getTimeMultiplier();

  const heatmap = {};
  const predictions = {};

  sectors.forEach(s => {
    const cfg = SECTOR_CONFIG[s];

    // Update momentum: small random walk + pull toward time-based mean
    const mean = timeMul * 100 * cfg.baseActivity;
    const pullToMean = (mean - state.densities[s]) * 0.08;
    state.momentum[s] = state.momentum[s] * 0.85 + pullToMean + (Math.random() - 0.5) * 3;

    // Apply momentum
    state.densities[s] = Math.max(5, Math.min(100, state.densities[s] + state.momentum[s]));
    heatmap[s] = Math.round(state.densities[s]);

    // Predict 15 minutes ahead
    predictions[s] = predictDensity(state.densities[s], state.momentum[s], timeMul);
  });

  // Calculate wait times per facility using sector density + time
  const dominantDensity = Object.values(heatmap).reduce((a, b) => a + b, 0) / sectors.length;
  const queues = FACILITIES.map(f => {
    const rawWait = densityToWaitTime(dominantDensity * timeMul, f.baseCap);
    const noise = Math.round((Math.random() - 0.5) * 4);
    return {
      name: f.name,
      zone: f.zone,
      waitTime: Math.max(1, Math.min(rawWait + noise, 60)),
    };
  });

  const totalCrowd = Object.values(heatmap).reduce((sum, d) => {
    const s = sectors[Object.values(heatmap).indexOf(d)];
    return sum + Math.round((d / 100) * (SECTOR_CONFIG[s]?.capacity || 300));
  }, 0);

  // Navigation best path (3 lowest density sectors)
  const sortedSectors = Object.entries(heatmap).sort((a, b) => a[1] - b[1]);
  const bestPath = sortedSectors.slice(0, 3).map(([s]) => s);

  // Generate contextual AI insights
  const insights = generateInsights(heatmap, predictions, queues);

  // Overall risk level
  const avgDensity = Object.values(heatmap).reduce((a, b) => a + b, 0) / sectors.length;
  const risk = avgDensity > 70 ? 'critical' : avgDensity > 50 ? 'warning' : 'normal';

  return {
    heatmap,
    predictions,
    totalCrowd,
    queues,
    insights,
    bestPath,
    risk,
    timeMul: Math.round(timeMul * 100),
    tick: state.tick,
  };
};

module.exports = { generateSimulationData, SECTOR_CONFIG };
