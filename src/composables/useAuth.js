import { ref, computed } from 'vue';
import { supabase } from '../supabase.js';

const user = ref(null);
const loading = ref(true);
let authSubscription = null;

export function useAuth() {
  const isAnonymous = computed(() => user.value?.is_anonymous === true);
  const isSignedIn = computed(() => !!user.value && !isAnonymous.value);
  const email = computed(() => user.value?.email || user.value?.user_metadata?.full_name || '');

  async function init() {
    loading.value = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        await supabase.auth.signInAnonymously();
      } else {
        user.value = session.user;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null;
      });
      authSubscription = subscription;
    } finally {
      loading.value = false;
    }
  }

  async function signUpWithEmail(emailVal, password) {
    if (user.value?.is_anonymous) {
      return await supabase.auth.updateUser({ email: emailVal, password });
    }
    return await supabase.auth.signUp({ email: emailVal, password });
  }

  async function signInWithEmail(emailVal, password) {
    return await supabase.auth.signInWithPassword({ email: emailVal, password });
  }

  async function signOut() {
    const { error: signOutErr } = await supabase.auth.signOut();
    if (signOutErr) throw signOutErr;
    const { error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) throw anonErr;
  }

  return {
    user,
    loading,
    isAnonymous,
    isSignedIn,
    email,
    init,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  };
}
