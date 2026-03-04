import { ref, computed } from 'vue';

const STORAGE_KEY = 'ink-tasks-streak';

function getStreakData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, lastDate: null };
}

function saveStreakData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const streak = ref(getStreakData());

export function useStreak() {
  const count = computed(() => streak.value.count);

  function recordProgress() {
    const today = new Date().toISOString().slice(0, 10);
    const data = getStreakData();

    if (data.lastDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (data.lastDate === yesterday) {
      data.count += 1;
    } else {
      data.count = 1;
    }
    data.lastDate = today;
    saveStreakData(data);
    streak.value = { ...data };
  }

  return { count, recordProgress };
}
