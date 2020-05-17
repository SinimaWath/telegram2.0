export const type = (input) => (error) => {
  if (error && error.field === input) {
    return 'is-danger';
  }

  return void 0;
};

export const text = (input) => (error) => {
  if (error && error.field === input) {
    return error.error;
  }

  return void 0;
};
