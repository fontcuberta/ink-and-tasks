import { ref } from 'vue';
import { supabase } from '../supabase.js';
import { useAuth } from './useAuth.js';

const forms = ref([]);
const loading = ref(false);

export function useConsent() {
  const { user } = useAuth();

  async function load() {
    loading.value = true;
    const { data, error } = await supabase
      .from('consent_forms')
      .select('*, projects(client_name)')
      .order('signed_at', { ascending: false });

    if (error) {
      console.error('[Consent]', error.message);
      return { error };
    }
    forms.value = data ?? [];
    loading.value = false;
    return { data };
  }

  async function create(form, signatureBlob) {
    const userId = user.value?.id;
    let signaturePath = null;

    if (signatureBlob) {
      const filename = `${userId}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filename, signatureBlob, { contentType: 'image/png' });

      if (uploadError) return { error: uploadError };
      signaturePath = filename;
    }

    const { data, error } = await supabase.from('consent_forms').insert({
      ...form,
      signature_path: signaturePath,
      user_id: userId,
      signed_at: new Date().toISOString(),
    }).select().single();

    if (!error) await load();
    return { data, error };
  }

  return { forms, loading, load, create };
}
