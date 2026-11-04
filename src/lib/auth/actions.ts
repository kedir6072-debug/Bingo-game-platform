import { createServerClient } from './client';

export async function signUp(email: string, password: string, username: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });
  
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  const supabase = createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset`
  });
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const supabase = createServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return session;
}
