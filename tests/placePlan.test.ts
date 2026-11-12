import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePlacePlanVisits } from '../server/api/_lib/placePlan.ts';

const validVisit = {
  name: 'Mie Serasi UNS',
  time: '10:30',
  mapsUrl: 'https://www.google.com/maps?q=-7.552372784489211,110.85986399489016',
};

test('validates and normalizes saved visit data', () => {
  assert.deepEqual(validatePlacePlanVisits([{ ...validVisit, name: ' Mie Serasi UNS ' }]), [
    { ...validVisit, name: 'Mie Serasi UNS' },
  ]);
});

test('accepts multiple visits but rejects empty and oversized plans', () => {
  const secondVisit = {
    ...validVisit,
    name: 'Solo Square',
    time: '12:00',
    mapsUrl: 'https://www.google.com/maps?q=-7.560842310271578,110.78852662557664',
  };
  assert.equal(validatePlacePlanVisits([validVisit, secondVisit])?.length, 2);
  assert.equal(validatePlacePlanVisits([]), null);
  assert.equal(validatePlacePlanVisits(Array.from({ length: 7 }, (_, index) => ({ ...validVisit, name: `Tempat ${index}` }))), null);
});

test('validates planned visits and accepts Google Maps links without coordinates', () => {
  assert.equal(validatePlacePlanVisits([{ ...validVisit, time: '25:00' }]), null);
  assert.equal(validatePlacePlanVisits([{ ...validVisit, name: ' ' }]), null);
  assert.equal(validatePlacePlanVisits([{ ...validVisit, mapsUrl: 'javascript:alert(1)' }]), null);
  assert.deepEqual(
    validatePlacePlanVisits([{ ...validVisit, mapsUrl: 'https://maps.app.goo.gl/example' }]),
    [{ ...validVisit, mapsUrl: 'https://maps.app.goo.gl/example' }]
  );
  assert.notEqual(
    validatePlacePlanVisits([{ ...validVisit, mapsUrl: 'https://www.google.com/maps/search/?api=1&query=coffee' }]),
    null
  );
});
