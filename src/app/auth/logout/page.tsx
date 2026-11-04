import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function LogoutPage() {
  const cookieStore = cookies();
  const supabase = createServerClient();
  
  await supabase.auth.signOut();
  redirect('/auth/login');
}
