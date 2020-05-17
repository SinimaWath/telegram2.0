export class ApiServiceDummy {
  async connect(settings) {
    console.log(settings);
    return Promise.resolve({ error: null });
  }

  async send(params) {
    console.log(params);
    return Promise.resolve({ error: null });
  }
}

export class ApiServiceElectron {
  constructor(ipc) {
    this.ipc = ipc;
  }

  async connect(settings) {
    return new Promise((resolve) => {
      this.ipc.on('connect-ok', resolve);
      this.ipc.on('connect-error', (event, error) => {
        resolve({error});
      });

      this.ipc.send('connect', {
        settings
      });
    });
  }

  async send(params) {
    return new Promise((resolve) => {
      this.ipc.on('send-ok', resolve);
      this.ipc.on('send-error', (event, error) => {
        resolve({error});
      });

      const file = params.file;
      this.ipc.send('send', {
        file: {
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }
      });
    });
  }

  async listen(event, clb) {
    this.ipc.on(event, (event, args) => {
      console.log(event);
      clb(args);
    })
  }

  async save(params) {
    return new Promise((resolve) => {
      this.ipc.on('save-ok', resolve);
      this.ipc.on('save-error', (event, error) => {
        resolve({error});
      });

      this.ipc.send('save', {
        path: params.path
      });
    });
  }
}
