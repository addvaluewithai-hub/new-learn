// Scientific invariants protect the migrated interactive experiments and graph meaning.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  gasState,
  lawGraph,
  celsiusToKelvin,
  phaseChanges,
  type GasLaw,
} from '../../../content/imported/chemistry-gas-laws/chem-gas-states-matter/board/physics';

const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} differs from ${expected}`);

test('gas experiments preserve amount and the explicitly locked variable across slider ranges', () => {
  for (const law of ['boyle', 'charles', 'pressure', 'combined'] as GasLaw[])
    for (const pressure of [0.5, 1, 1.95, 3])
      for (const temperature of [200, 300, 425, 550]) {
        const state = gasState(law, pressure, temperature);
        near((state.pressure * state.volume) / state.temperature, 0.008);
        if (law === 'boyle') near(state.temperature, 300);
        if (law === 'charles') near(state.pressure, 1);
        if (law === 'pressure') near(state.volume, 2.4);
      }
  near(gasState('boyle', 2, 300).volume, 1.2);
  near(gasState('charles', 1, 450).volume, 3.6);
  near(gasState('pressure', 1, 450).pressure, 1.5);
});

test('graphs distinguish inverse pressure from linear reciprocal pressure and absolute temperature', () => {
  const inverse = lawGraph('boyle');
  for (const [i, point] of inverse.entries()) {
    near(point.x * point.y, 2.4);
    if (i) assert.ok(point.y < inverse[i - 1].y);
  }
  for (const point of lawGraph('boyle', true)) near(point.y, 2.4 * point.x);
  for (const point of lawGraph('charles')) near(point.y, 0.008 * point.x);
  for (const point of lawGraph('pressure')) near(point.y, point.x / 300);
});

test('the absolute temperature scale and six phase-change directions remain correct', () => {
  near(celsiusToKelvin(-273.15), 0);
  near(celsiusToKelvin(20), 293.15);
  assert.ok(celsiusToKelvin(40) / celsiusToKelvin(20) < 1.07);
  assert.equal(phaseChanges.length, 6);
  for (const change of phaseChanges) {
    const reverse = phaseChanges.find(
      (other) => other.from === change.to && other.to === change.from,
    );
    assert.ok(reverse);
    assert.notEqual(change.heating, reverse.heating);
  }
});
