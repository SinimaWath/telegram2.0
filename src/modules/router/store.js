import { writable, derived } from 'svelte/store';

function createRouter() {
  const { subscribe, set, update } = writable({
      name: ''
  });

  return {
    subscribe,
    nav: (name) => set({name}),
    reset: () => set({})
  };
}

export const router = createRouter();
