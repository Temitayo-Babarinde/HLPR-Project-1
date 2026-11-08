const CUNY_EMAIL_PATTERN = /^[^@\s]+@(myhunter\.cuny\.edu|login\.cuny\.edu)$/;

export function normalizeCunyEmail(value) {
  return value.trim().toLowerCase();
}

export function isSupportedCunyEmail(value) {
  return CUNY_EMAIL_PATTERN.test(normalizeCunyEmail(value));
}
