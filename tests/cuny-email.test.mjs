import test from 'node:test';
import assert from 'node:assert/strict';
import { isSupportedCunyEmail, normalizeCunyEmail } from '../lib/auth/cuny-email.mjs';

test('normalizes CUNY email input', () => {
  assert.equal(normalizeCunyEmail('  Student71@LOGIN.CUNY.EDU  '), 'student71@login.cuny.edu');
});

test('accepts both supported CUNY email domains', () => {
  assert.equal(isSupportedCunyEmail('student@myhunter.cuny.edu'), true);
  assert.equal(isSupportedCunyEmail('STUDENT71@LOGIN.CUNY.EDU'), true);
});

test('rejects malformed and lookalike email domains', () => {
  const invalidEmails = [
    'student@hunter.cuny.edu',
    'student@myhunter.cuny.edu.example.com',
    'student@fake-login.cuny.edu',
    'student@example.com@login.cuny.edu',
    '@login.cuny.edu',
  ];

  invalidEmails.forEach((email) => assert.equal(isSupportedCunyEmail(email), false, email));
});
