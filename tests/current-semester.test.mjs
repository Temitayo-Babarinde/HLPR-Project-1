import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentSemester } from '../lib/classes/current-semester.mjs';

test('selects the current academic term from the date', () => {
  assert.equal(getCurrentSemester(new Date(2027, 0, 15)), 'Spring 2027');
  assert.equal(getCurrentSemester(new Date(2027, 5, 15)), 'Summer 2027');
  assert.equal(getCurrentSemester(new Date(2027, 8, 15)), 'Fall 2027');
});

test('changes terms at the expected month boundaries', () => {
  assert.equal(getCurrentSemester(new Date(2027, 4, 31)), 'Spring 2027');
  assert.equal(getCurrentSemester(new Date(2027, 5, 1)), 'Summer 2027');
  assert.equal(getCurrentSemester(new Date(2027, 7, 31)), 'Summer 2027');
  assert.equal(getCurrentSemester(new Date(2027, 8, 1)), 'Fall 2027');
});
