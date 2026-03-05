import { ref } from 'vue';
import { supabase } from '../supabase.js';
import { useAuth } from './useAuth.js';

const events = ref([]);
const loading = ref(false);

export function useCalendar() {
  const { user } = useAuth();

  async function load() {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, projects(client_name, style)')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[Calendar]', error.message);
        return { error };
      }
      events.value = data ?? [];
      return { data };
    } finally {
      loading.value = false;
    }
  }

  async function create(event) {
    const { data, error } = await supabase.from('calendar_events').insert({
      ...event,
      user_id: user.value?.id,
    }).select().single();

    if (!error) await load();
    return { data, error };
  }

  async function update(id, changes) {
    const { error } = await supabase
      .from('calendar_events')
      .update(changes)
      .eq('id', id);

    if (!error) await load();
    return { error };
  }

  async function remove(id) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (!error) await load();
    return { error };
  }

  async function loadForProject(projectId) {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('project_id', projectId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (error) return { data: [], error };
    return { data: data ?? [], error: null };
  }

  return { events, loading, load, create, update, remove, loadForProject };
}
