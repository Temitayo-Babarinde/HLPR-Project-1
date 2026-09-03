import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import ClassHub from '../../../components/ClassHub';

export default async function ClassPage({ params }) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: section } = await supabase
    .from('sections')
    .select('id, section_number, semester, professor_name, courses(department, number, title)')
    .eq('id', sectionId)
    .maybeSingle();

  if (!section) redirect('/dashboard');

  const { data: membership } = await supabase.from('enrollments').select('section_id').eq('section_id', sectionId).maybeSingle();

  if (!membership) redirect('/dashboard');

  return <ClassHub section={section} />;
}
