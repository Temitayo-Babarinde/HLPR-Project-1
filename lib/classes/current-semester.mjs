export function getCurrentSemester(date = new Date()) {
  const month = date.getMonth();
  const term = month < 5 ? 'Spring' : month < 8 ? 'Summer' : 'Fall';

  return `${term} ${date.getFullYear()}`;
}
