import { ref } from 'vue';
import { supabase } from '../supabase.js';
import { useAuth } from './useAuth.js';

const projects = ref([]);
const loading = ref(false);

const COLUMNS = ['inbox', 'deposit', 'drawing', 'ready', 'done'];

export function useProjects() {
  const { user } = useAuth();

  async function load() {
    loading.value = true;
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_images(id, storage_path, is_primary)')
      .order('position', { ascending: true });

    if (error) {
      console.error('[Projects]', error.message);
      return { error };
    }
    projects.value = data ?? [];
    loading.value = false;
    return { data };
  }

  async function create(project) {
    const maxPos = projects.value
      .filter(p => p.status === 'inbox')
      .reduce((max, p) => Math.max(max, p.position ?? 0), 0);

    const { data, error } = await supabase.from('projects').insert({
      ...project,
      status: 'inbox',
      position: maxPos + 1,
      user_id: user.value?.id,
    }).select().single();

    if (!error) await load();
    return { data, error };
  }

  async function update(id, changes) {
    const { error } = await supabase
      .from('projects')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) await load();
    return { error };
  }

  async function moveToColumn(id, newStatus, newPosition) {
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus, position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) await load();
    return { error };
  }

  async function remove(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) await load();
    return { error };
  }

  function byColumn(status) {
    return projects.value
      .filter(p => p.status === status)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  return {
    projects,
    loading,
    COLUMNS,
    load,
    create,
    update,
    moveToColumn,
    remove,
    byColumn,
  };
}
