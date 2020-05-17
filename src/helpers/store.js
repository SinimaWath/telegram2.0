export const waitForNotNull = (store) => {
  let unsub = null;

  return new Promise(resolve => {
    unsub = store.subscribe((value) => {
      if (value) {
        resolve(value);
      }
    });
  }).finally(unsub);
};
