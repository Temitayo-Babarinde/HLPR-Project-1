'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

const DEPARTMENTS = ['AFPRL', 'ANTHC', 'BIOL', 'CHEM', 'CSCI', 'ECON', 'ENGL', 'HIST', 'MATH', 'MEDIA', 'PHIL', 'PHYS', 'POLSC', 'PSYCH', 'SOC'];

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
  const courseNumber = number.trim() || '—';
  const courseTitle = title.trim() || 'Course title will be added automatically';

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: sectionId, error: joinError } = await supabase.rpc('join_or_create_section', {
      p_department: department,
      p_number: number.trim(),
      p_title: title.trim() || `${department} ${number.trim()}`,
      p_section_number: section.trim(),
      p_semester: semester.trim(),
      p_professor_name: professor.trim() || null,
    });
    if (joinError) {
      setError(joinError.message || 'Could not join this class.');
      setLoading(false);
      return;
    }
    router.push(`/class/${sectionId}`);
    router.refresh();
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

        <form onSubmit={handleJoin} className="card join-card">
          <div className="join-preview" aria-live="polite">
            <span>{department} {courseNumber}</span>
            <strong>{courseTitle}</strong>
            <small>{section.trim() || 'Section —'} · {semester.trim() || 'Semester —'}</small>
          </div>

          <div className="join-grid">
            <label>
              <span>Department</span>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Course number</span>
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="12700" inputMode="numeric" autoComplete="off" required />
            </label>
            <label>
              <span>Section</span>
              <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="01" autoComplete="off" required />
            </label>
            <label>
              <span>Semester</span>
              <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Fall 2026" autoComplete="off" required />
            </label>
          </div>
          <label className="join-field">
            <span>Course title <small>optional</small></span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Analysis & Design" autoComplete="off" />
          </label>
          <label className="join-field">
            <span>Professor <small>optional</small></span>
            <input value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Professor's name" autoComplete="off" />
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
