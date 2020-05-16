export class ApiServiceDummy {
  async connect(settings) {
    console.log(settings);
    return Promise.resolve({ error: null });
  }
}
