import test from 'node:test';
import assert from 'node:assert/strict';
import { collapseWhitespace, normalizeIdentifier, normalizeSemester } from '../lib/classes/join-input.mjs';

test('collapses surrounding and repeated whitespace in class details', () => {
  assert.equal(collapseWhitespace('  Software   Analysis  & Design  '), 'Software Analysis & Design');
  assert.equal(collapseWhitespace('  Professor\tAda\nLovelace '), 'Professor Ada Lovelace');
});

test('normalizes course and section identifiers', () => {
  assert.equal(normalizeIdentifier('  127p  '), '127P');
  assert.equal(normalizeIdentifier('  01 a '), '01 A');
});

test('standardizes supported semester names', () => {
  assert.equal(normalizeSemester(' fall   2026 '), 'Fall 2026');
  assert.equal(normalizeSemester('SPRING 2027'), 'Spring 2027');
  assert.equal(normalizeSemester('winter 2027'), 'Winter 2027');
});
