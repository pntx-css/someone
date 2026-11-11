import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getProgressiveEmptyCardCount,
  parseGoogleMapsUrl,
} from '../src/data/customPlace.ts';
import { specialPlaces, specialPlacePlaceholders } from '../src/data/specialPlaces.ts';

test('progressively exposes one empty slot until three places are registered', () => {
  assert.equal(getProgressiveEmptyCardCount(0), 1);
  assert.equal(getProgressiveEmptyCardCount(1), 1);
  assert.equal(getProgressiveEmptyCardCount(2), 1);
  assert.equal(getProgressiveEmptyCardCount(3), 0);
  assert.equal(getProgressiveEmptyCardCount(4), 0);
});

test('a removed place restores the next progressive empty slot', () => {
  assert.equal(getProgressiveEmptyCardCount(2), 1);
  assert.equal(getProgressiveEmptyCardCount(1), 1);
  assert.equal(getProgressiveEmptyCardCount(0), 1);
});

test('default place cards use the provided names and coordinates', () => {
  assert.deepEqual(
    specialPlaces.map(({ title, latitude, longitude }) => ({ title, latitude, longitude })),
    [
      { title: 'Mie Serasi UNS', latitude: -7.552372784489211, longitude: 110.85986399489016 },
      { title: 'Mie Ayam Worth It', latitude: -7.550042383516451, longitude: 110.86104288324695 },
      { title: 'Solo Square', latitude: -7.560842310271578, longitude: 110.78852662557664 },
    ]
  );
  assert.equal(specialPlaces.length + specialPlacePlaceholders.length, 6);
});

test('parses coordinate query parameters and supported Maps URL formats', () => {
  assert.deepEqual(
    parseGoogleMapsUrl('https://www.google.com/maps?q=-7.5667,110.8167'),
    { latitude: -7.5667, longitude: 110.8167 }
  );
  assert.deepEqual(
    parseGoogleMapsUrl('https://maps.google.co.id/maps/place/Cafe/@-7.5,110.8,15z'),
    { latitude: -7.5, longitude: 110.8 }
  );
  assert.deepEqual(
    parseGoogleMapsUrl('https://www.google.com/maps/place/Cafe/data=!3d-7.4!4d110.7'),
    { latitude: -7.4, longitude: 110.7 }
  );
});

test('rejects invalid URLs, non-HTTPS protocols, and unsupported domains', () => {
  for (const value of [
    'not a URL',
    'http://www.google.com/maps?q=-7.5,110.8',
    'javascript:alert(1)',
    'https://google.com.evil.example/maps?q=-7.5,110.8',
    'https://maps.google.com.evil.example/?q=-7.5,110.8',
  ]) {
    assert.throws(() => parseGoogleMapsUrl(value));
  }
});

test('explains that short Google Maps URLs need a complete link', () => {
  assert.throws(
    () => parseGoogleMapsUrl('https://maps.app.goo.gl/example'),
    /Link pendek belum didukung/
  );
});

test('rejects missing and out-of-range coordinates', () => {
  assert.throws(
    () => parseGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=coffee'),
    /Koordinat tidak ditemukan/
  );
  assert.throws(
    () => parseGoogleMapsUrl('https://www.google.com/maps?q=91,110'),
    /di luar rentang/
  );
  assert.throws(
    () => parseGoogleMapsUrl('https://www.google.com/maps?q=-7,181'),
    /di luar rentang/
  );
});
