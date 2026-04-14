/**
 * @file simulationService.test.js
 * @description Unit tests for the AI crowd simulation engine.
 *
 * These are pure unit tests — no DB, no HTTP.
 * They verify the simulation output is correctly shaped and within valid ranges.
 */

const { generateSimulationData, SECTOR_CONFIG } = require('../services/simulationService');

// ─── Setup ────────────────────────────────────────────────────────────────────

// Run several simulation ticks so momentum has time to warm up
let snapshot;
beforeAll(() => {
  for (let i = 0; i < 5; i++) generateSimulationData(); // warm up momentum
  snapshot = generateSimulationData();
});

// ─── SECTOR_CONFIG ─────────────────────────────────────────────────────────────

describe('SECTOR_CONFIG', () => {
  it('should define config for all 12 sectors', () => {
    const sectors = Object.keys(SECTOR_CONFIG);
    expect(sectors).toHaveLength(12);
  });

  it('each sector should have capacity, zone, and baseActivity', () => {
    for (const [sector, cfg] of Object.entries(SECTOR_CONFIG)) {
      expect(cfg.capacity).toBeGreaterThan(0);
      expect(typeof cfg.zone).toBe('string');
      expect(cfg.baseActivity).toBeGreaterThan(0);
      expect(cfg.baseActivity).toBeLessThanOrEqual(1);
    }
  });
});

// ─── generateSimulationData output shape ─────────────────────────────────────

describe('generateSimulationData() — output shape', () => {
  it('should return a heatmap object', () => {
    expect(snapshot.heatmap).toBeDefined();
    expect(typeof snapshot.heatmap).toBe('object');
  });

  it('should return 12 sector entries in the heatmap', () => {
    expect(Object.keys(snapshot.heatmap)).toHaveLength(12);
  });

  it('should return a predictions object with 12 sectors', () => {
    expect(snapshot.predictions).toBeDefined();
    expect(Object.keys(snapshot.predictions)).toHaveLength(12);
  });

  it('should return queues as a non-empty array', () => {
    expect(Array.isArray(snapshot.queues)).toBe(true);
    expect(snapshot.queues.length).toBeGreaterThan(0);
  });

  it('should return insights as a non-empty array', () => {
    expect(Array.isArray(snapshot.insights)).toBe(true);
    expect(snapshot.insights.length).toBeGreaterThan(0);
  });

  it('should return bestPath with 3 sectors', () => {
    expect(Array.isArray(snapshot.bestPath)).toBe(true);
    expect(snapshot.bestPath).toHaveLength(3);
  });

  it('should return a valid risk level', () => {
    expect(['normal', 'warning', 'critical']).toContain(snapshot.risk);
  });

  it('should include totalCrowd as a positive integer', () => {
    expect(typeof snapshot.totalCrowd).toBe('number');
    expect(snapshot.totalCrowd).toBeGreaterThan(0);
  });

  it('should include timeMul between 0 and 100', () => {
    expect(snapshot.timeMul).toBeGreaterThanOrEqual(0);
    expect(snapshot.timeMul).toBeLessThanOrEqual(100);
  });

  it('should include a tick counter incremented each call', () => {
    const snap1 = generateSimulationData();
    const snap2 = generateSimulationData();
    expect(snap2.tick).toBe(snap1.tick + 1);
  });
});

// ─── Heatmap value constraints ────────────────────────────────────────────────

describe('generateSimulationData() — heatmap values', () => {
  it('all sector densities should be between 5 and 100', () => {
    for (const [sector, density] of Object.entries(snapshot.heatmap)) {
      expect(density).toBeGreaterThanOrEqual(5);
      expect(density).toBeLessThanOrEqual(100);
    }
  });

  it('all predicted densities should be between 5 and 100', () => {
    for (const [sector, density] of Object.entries(snapshot.predictions)) {
      expect(density).toBeGreaterThanOrEqual(5);
      expect(density).toBeLessThanOrEqual(100);
    }
  });

  it('only known sectors should appear in the heatmap', () => {
    const knownSectors = new Set(Object.keys(SECTOR_CONFIG));
    for (const sector of Object.keys(snapshot.heatmap)) {
      expect(knownSectors.has(sector)).toBe(true);
    }
  });
});

// ─── Queue constraints ────────────────────────────────────────────────────────

describe('generateSimulationData() — queues', () => {
  it('each queue should have a name and a non-negative waitTime', () => {
    for (const q of snapshot.queues) {
      expect(typeof q.name).toBe('string');
      expect(q.name.length).toBeGreaterThan(0);
      expect(q.waitTime).toBeGreaterThanOrEqual(1);
    }
  });

  it('wait times should not exceed 60 minutes', () => {
    for (const q of snapshot.queues) {
      expect(q.waitTime).toBeLessThanOrEqual(60);
    }
  });
});

// ─── Insights ─────────────────────────────────────────────────────────────────

describe('generateSimulationData() — insights', () => {
  it('each insight should have a valid level and a message string', () => {
    const validLevels = ['critical', 'warning', 'info', 'success'];
    for (const insight of snapshot.insights) {
      expect(validLevels).toContain(insight.level);
      expect(typeof insight.message).toBe('string');
      expect(insight.message.length).toBeGreaterThan(0);
    }
  });
});

// ─── bestPath ─────────────────────────────────────────────────────────────────

describe('generateSimulationData() — bestPath', () => {
  it('should recommend sectors that exist in the heatmap', () => {
    for (const sector of snapshot.bestPath) {
      expect(snapshot.heatmap[sector]).toBeDefined();
    }
  });

  it('should recommend the sectors with the lowest density', () => {
    const sorted = Object.entries(snapshot.heatmap)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([s]) => s);

    // All 3 recommended sectors should be among the 3 lowest-density ones
    for (const s of snapshot.bestPath) {
      expect(sorted).toContain(s);
    }
  });
});
