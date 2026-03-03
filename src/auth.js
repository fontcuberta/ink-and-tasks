import { supabase } from './supabase.js';

// ============================================================
// STATE
// ============================================================

export let currentUser = null;

// ============================================================
// INIT — call once on app load
// ============================================================

export async function initAuth(onAuthChange) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    await supabase.auth.signInAnonymously();
  } else {
    currentUser = session.user;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    onAuthChange(currentUser);
  });

  return currentUser;
}

// ============================================================
// HELPERS
// ============================================================

export function isAnonymous(user) {
  return user?.is_anonymous === true;
}

// ============================================================
// AUTH ACTIONS
// ============================================================

// Anonymous user → upgrade to permanent account with email/password
// (keeps the same user_id, tasks are preserved)
export async function signUpWithEmail(email, password) {
  if (currentUser?.is_anonymous) {
    return await supabase.auth.updateUser({ email, password });
  }
  return await supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

// Anonymous user → link Google identity (keeps user_id, tasks preserved)
// Signed-in user → sign in fresh with Google
export async function signInWithGoogle() {
  const redirectTo = window.location.origin;
  if (currentUser?.is_anonymous) {
    return await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo },
    });
  }
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  // Always return to an anonymous session after sign-out
  await supabase.auth.signInAnonymously();
}
