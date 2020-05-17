import { writable, derived } from 'svelte/store';

function createModal() {
  const { subscribe, set, update } = writable({
    type: '',
    text: ''
  });

  return {
    subscribe,
    prompt: (text) => set({
      type: 'prompt',
      text
    }),
    alert: (text) => set({
      type: 'alert',
      text
    }),
    success: (text) => set({
      type: 'success',
      text
    }),
    reset: () => set({})
  };
}

export const modal = createModal();
export const modalResponse = writable('');
