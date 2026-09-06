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
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <div className="dashboard-brand">hlpr<span>.</span></div>
            <p className="dashboard-kicker">Student workspace</p>
            <h1>Your classes</h1>
            <p className="dashboard-email">Signed in as {user.email}</p>
          </div>
          <div className="dashboard-actions"><SignOutButton /><Link href="/join" className="dashboard-join">+ Join a class</Link></div>
        </header>

        {error && <p className="error">We could not load your classes. Refresh and try again.</p>}

        {classes.length === 0 ? (
          <section className="dashboard-empty">
            <div aria-hidden="true">+</div>
            <p className="eyebrow">Build your semester</p>
            <h2>Your class space starts here</h2>
            <p>Join a course to share tasks, compare syllabus notes, and talk with classmates.</p>
            <Link href="/join" className="dashboard-join">Find your first class</Link>
          </section>
        ) : (
          <section aria-labelledby="course-list-heading">
            <div className="dashboard-section-title"><div><p className="eyebrow">Current semester</p><h2 id="course-list-heading">Course spaces</h2></div><span>{classes.length} {classes.length === 1 ? 'class' : 'classes'}</span></div>
            <div className="course-grid">
            {classes.map((c) => (
              <Link key={c.id} href={`/class/${c.id}`} className="course-card">
                <div className="course-card-top"><span>{c.courses.department} {c.courses.number}</span><em>{c.semester}</em></div>
                <h3>{c.courses.title}</h3>
                <div className="course-card-meta"><span>Section {c.section_number}</span>{c.professor_name ? <span>{c.professor_name}</span> : null}</div>
                <div className="course-card-open">Open class <span aria-hidden="true">→</span></div>
              </Link>
            ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
