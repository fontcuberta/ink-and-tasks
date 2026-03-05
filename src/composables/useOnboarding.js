import { ref } from 'vue';

const STORAGE_KEY = 'ink_onboarding_done';
const isDone = ref(localStorage.getItem(STORAGE_KEY) === '1');

export function useOnboarding() {
  function markDone() {
    localStorage.setItem(STORAGE_KEY, '1');
    isDone.value = true;
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    isDone.value = false;
  }

  return { isDone, markDone, reset };
}
