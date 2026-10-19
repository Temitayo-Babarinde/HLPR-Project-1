import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import ClassHub from '../../../components/ClassHub';

export default async function ClassPage({ params }) {
  const { sectionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error('The class session could not be verified.');
  if (!user) redirect('/login');

  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id, section_number, semester, professor_name, courses(department, number, title)')
    .eq('id', sectionId)
    .maybeSingle();

  if (sectionError) throw new Error('The class details could not be loaded.');
  if (!section) redirect('/dashboard');

  const { data: membership, error: membershipError } = await supabase
    .from('enrollments')
    .select('section_id')
    .eq('section_id', sectionId)
    .maybeSingle();

  if (membershipError) throw new Error('Class membership could not be verified.');
  if (!membership) redirect('/dashboard');

  return <ClassHub section={section} />;
}
