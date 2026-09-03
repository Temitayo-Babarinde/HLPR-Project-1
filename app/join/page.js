'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <main className="shell">
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Join a class</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
          If your section is missing, fill it in. The next classmate who searches for it lands in the same place.
        </p>

        <form onSubmit={handleJoin} className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Course #" required style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section" required style={{ ...inputStyle, flex: 1 }} />
            <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Semester" required style={{ ...inputStyle, flex: 1 }} />
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title (if new)" style={inputStyle} />
          <input value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Professor (optional)" style={inputStyle} />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Joining…' : 'Find & join class'}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  marginBottom: 10,
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  background: '#3F0157',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
