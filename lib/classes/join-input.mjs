export function collapseWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeIdentifier(value) {
  return collapseWhitespace(value).toUpperCase();
}

export function normalizeSemester(value) {
  return collapseWhitespace(value).replace(
    /^(spring|summer|fall|winter)\s+(\d{4})$/i,
    (_, term, year) => `${term[0].toUpperCase()}${term.slice(1).toLowerCase()} ${year}`,
  );
}
