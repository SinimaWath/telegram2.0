export class ApiServiceDummy {
  async connect(settings) {
    console.log(settings);
    return Promise.resolve({ error: null });
  }
}

export class ApiServiceElectron {
  constructor(ipc) {
    this.ipc = ipc;
  }

  async connect(settings) {
    return new Promise((resolve, reject) => {
      this.ipc.on('connect-ok', resolve);
      this.ipc.on('connect-error', (event, error) => {
        resolve({error});
      });

      this.ipc.send('connect', {
        settings
      });
    });
  }
}
