import { writable, derived } from 'svelte/store';

function createSettings() {
  const { subscribe, set, update } = writable({
    comport: 'COM1',
    speed: 10
  });

  return {
    subscribe,
    set: (newSettings) => set(newSettings),
    reset: () => set({})
  };
}

export const settings = createSettings();

const isValidCom = (value) => value && !!value.match(/COM[0-9][0-9]?/);
const isValidSpeed = (value) => !Number.isNaN(parseFloat(value)) && value > 0;

export const error = derived(
  settings,
  $settings => {
      if (!isValidCom($settings.comport)) {
        return {
          field: 'comport',
          error: 'Invalid comport format. True format is COM[0-9][0-9]?'
        }
      }

      if (!isValidSpeed($settings.speed)) {
        return {
          field: 'speed',
          error: 'Invalid speed'
        }
      }

      return false;
  }
);
