'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

const DEPARTMENTS = ['AFPRL', 'ANTHC', 'BIOL', 'CHEM', 'CSCI', 'ECON', 'ENGL', 'HIST', 'MATH', 'MEDIA', 'PHIL', 'PHYS', 'POLSC', 'PSYCH', 'SOC'];

function collapseWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeIdentifier(value) {
  return collapseWhitespace(value).toUpperCase();
}

function normalizeSemester(value) {
  return collapseWhitespace(value).replace(
    /^(spring|summer|fall|winter)\s+(\d{4})$/i,
    (_, term, year) => `${term[0].toUpperCase()}${term.slice(1).toLowerCase()} ${year}`,
  );
}

export default function JoinPage() {
  const supabase = createClient();
  const router = useRouter();
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [number, setNumber] = useState('');
  const [section, setSection] = useState('01');
  const [semester, setSemester] = useState('Fall 2026');
  const [title, setTitle] = useState('');
  const [professor, setProfessor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const courseNumber = normalizeIdentifier(number) || '—';
  const courseTitle = collapseWhitespace(title) || 'Course title will be added automatically';
  const sectionNumber = normalizeIdentifier(section);
  const semesterName = normalizeSemester(semester);

  async function handleJoin(e) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    const normalizedNumber = normalizeIdentifier(number);
    const normalizedSection = normalizeIdentifier(section);
    const normalizedSemester = normalizeSemester(semester);
    const normalizedTitle = collapseWhitespace(title);
    const normalizedProfessor = collapseWhitespace(professor);
    setNumber(normalizedNumber);
    setSection(normalizedSection);
    setSemester(normalizedSemester);
    if (!normalizedNumber || !normalizedSection || !normalizedSemester) {
      setError('Enter a course number, section, and semester before joining.');
      setLoading(false);
      return;
    }

    try {
      const { data: sectionId, error: joinError } = await supabase.rpc('join_or_create_section', {
        p_department: department,
        p_number: normalizedNumber,
        p_title: normalizedTitle || `${department} ${normalizedNumber}`,
        p_section_number: normalizedSection,
        p_semester: normalizedSemester,
        p_professor_name: normalizedProfessor || null,
      });
      if (joinError || !sectionId) throw joinError || new Error('Missing section');
      router.push(`/class/${sectionId}`);
      router.refresh();
    } catch {
      setError('We couldn’t join this class. Check your connection and try again—your details are still here.');
      setLoading(false);
    }
  }

  return (
    <main className="shell join-shell">
      <div className="join-page">
        <Link href="/dashboard" className="join-back">← Back to classes</Link>
        <div className="join-heading">
          <span className="eyebrow">Your next study space</span>
          <h1>Join a class</h1>
        </div>
        <p className="join-intro">
          If your section is missing, fill it in. The next classmate who searches for it lands in the same place.
        </p>

        <form onSubmit={handleJoin} className="card join-card" aria-busy={loading}>
          <div className="join-preview" aria-live="polite">
            <span>{department} {courseNumber}</span>
            <strong>{courseTitle}</strong>
            <small>{sectionNumber || 'Section —'} · {semesterName || 'Semester —'}</small>
          </div>

          <div className="join-grid">
            <label>
              <span>Department</span>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} disabled={loading}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Course number</span>
              <input value={number} onChange={(e) => setNumber(e.target.value)} onBlur={() => setNumber(normalizeIdentifier(number))} placeholder="12700" inputMode="numeric" autoComplete="off" disabled={loading} required />
            </label>
            <label>
              <span>Section</span>
              <input value={section} onChange={(e) => setSection(e.target.value)} onBlur={() => setSection(normalizeIdentifier(section))} placeholder="01" autoComplete="off" disabled={loading} required />
            </label>
            <label>
              <span>Semester</span>
              <input value={semester} onChange={(e) => setSemester(e.target.value)} onBlur={() => setSemester(normalizeSemester(semester))} placeholder="Fall 2026" autoComplete="off" disabled={loading} required />
            </label>
          </div>
          <p className="join-format-note"><span aria-hidden="true">✦</span> Course, section, and semester formatting is standardized so classmates reach the same space.</p>
          <label className="join-field">
            <span>Course title <small>optional</small></span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Analysis & Design" autoComplete="off" disabled={loading} />
          </label>
          <label className="join-field">
            <span>Professor <small>optional</small></span>
            <input value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Professor's name" autoComplete="off" disabled={loading} />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <button type="submit" disabled={loading} className="join-submit">
            {loading ? 'Joining…' : 'Find & join class'}
          </button>
        </form>
      </div>
    </main>
  );
}
