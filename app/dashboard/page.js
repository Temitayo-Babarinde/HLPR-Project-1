import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import SignOutButton from '../../components/SignOutButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('section_id, sections(id, section_number, semester, professor_name, courses(department, number, title))')
    .order('joined_at', { ascending: false });

  const classes = (enrollments || []).map((e) => e.sections).filter(Boolean);

  return (
    <main className="shell">
      <div className="container">
        <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div>
            <div className="eyebrow">hlpr</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '5px 0 0' }}>Your classes</h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{user.email}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}><SignOutButton /><Link href="/join" style={buttonLinkStyle}>+ Join a class</Link></div>
        </div>

        {error && <p className="error">We could not load your classes. Refresh and try again.</p>}

        {classes.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: 10 }}>You have not joined a class yet.</p>
            <Link href="/join" style={{ color: '#3F0157', fontWeight: 600, fontSize: 14 }}>
              Find your class →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/class/${c.id}`}
                style={{
                  display: 'block',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderLeft: '4px solid #FCB827',
                  borderRadius: 10,
                  padding: '14px 16px',
                  textDecoration: 'none',
                }}
              >
                <p style={{ fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#3F0157', fontSize: 14 }}>
                  {c.courses.department} {c.courses.number}
                </p>
                <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
                  {c.courses.title} · Section {c.section_number} · {c.semester}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const buttonLinkStyle = {
  background: '#3F0157',
  color: 'white',
  borderRadius: 8,
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
};
