import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import SignOutButton from '../../components/SignOutButton';
import ClassList from '../../components/ClassList';

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

        {error ? (
          <section className="dashboard-empty dashboard-error" role="alert">
            <div aria-hidden="true">!</div>
            <p className="eyebrow">Classes unavailable</p>
            <h2>We couldn’t load your class spaces</h2>
            <p>Your classes are still safe. This is usually temporary, so try loading them again.</p>
            <Link href="/dashboard" className="dashboard-join">Try again</Link>
          </section>
        ) : classes.length === 0 ? (
          <section className="dashboard-empty">
            <div aria-hidden="true">+</div>
            <p className="eyebrow">Build your semester</p>
            <h2>Your class space starts here</h2>
            <p>Join a course to share tasks, compare syllabus notes, and talk with classmates.</p>
            <Link href="/join" className="dashboard-join">Find your first class</Link>
          </section>
        ) : (
          <ClassList classes={classes} />
        )}
      </div>
    </main>
  );
}
