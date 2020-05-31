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
      this.ipc.on('connect-ok', () => {
        console.log('connect-ok');
        resolve({error: null});
      });
      this.ipc.on('connect-error', (event, error) => {
        console.log('connect-error');
        resolve({error});
      });

      console.log('connect');

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

  listen(event, clb) {
    const handle = (_, args) => {
      clb(args);
    };

    this.ipc.on(event, handle);

    return () => {
      this.ipc.removeListener(event, handle);
    }
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
