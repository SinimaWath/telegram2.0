const SerialPort = require("serialport");
const {promisify} = require("util");
const delay = require("delay");
const {timeout, TimeoutError} = require("promise-timeout");
const chalk = require('chalk');
const {toArrayBuffer, toBuffer} = require("../helpers/buf");

const TIMEOUT = 1000;
const READ_DELAY = 100;

async function waitPortFlags(port, {dsr = false, dcd = false, cts = false} = {}) {
  const portGet = promisify(port.get.bind(port));

  while (true) {
    const flags = await portGet();
    let ok = true;
    if (dsr && !flags.dsr) ok = false;
    if (dcd && !flags.dcd) ok = false;
    if (cts && !flags.cts) ok = false;
    if (!ok) {
      await delay(READ_DELAY);
      continue;
    }
    return true;
  }
}

async function waitForQueue(queue, tout) {
  const tsStart = Date.now();

  while (true) {
    const buf = queue.shift();

    if (!buf) {
      if (Date.now() - tsStart > tout) {
        console.log(chalk.red('PHYS: READ GET TOUT'));
        throw new TimeoutError();
      }
      await delay(READ_DELAY);
      continue;
    }

    console.log(chalk.red('PHYS: READ GET'));
    return buf;
  }
}

class PhysicalConnection {
  constructor() {
    this._port = null;
    this._rxQueue = [];
  }

  async connect(path, {tout = TIMEOUT} = {}) {
    console.log(chalk.red(`PHYS CONNECT: path=${path}`));
    return timeout(this._connect(path), tout);
  }

  async _connect(path) {
    if (this._port)
      return;

    const portOpts = {
      autoOpen: false,
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      rtscts: false,
      stopBits: 1,
    };
    this._port = new SerialPort(path, portOpts);
    const portOpen = promisify(this._port.open.bind(this._port));
    const portSet = promisify(this._port.set.bind(this._port));

    await portOpen();
    // await portSet({dtr: true});
    // await waitPortFlags(this._port, {dsr: true, dcd: true});

    this._port.on('data', (data) => {
      this._rxQueue.push(data);
      console.log(chalk.red('PHYS: READ QUEUE'));
    });
  }

  async close({tout = TIMEOUT} = {}) {
    try {
      await timeout(this._close(), tout);
    } finally {
      if (this._port) {
        try {
          this._port.close();
        } finally {
          this._port = null;
          this._rxQueue = [];
        }
      }
    }
  }

  async _close() {
    if (!this._port)
      return;
    const portClose = promisify(this._port.close.bind(this._port));
    const portSet = promisify(this._port.set.bind(this._port));

    // await portSet({dtr: false, rts: false});
    await portClose();
    this._port = null;
  }

  async write(buf, {tout = TIMEOUT} = {}) {
    return timeout(this._write(buf), tout);
  }

  async _write(buf) {
    if (!this._port)
      return;
    const portDrain = promisify(this._port.drain.bind(this._port));
    const portSet = promisify(this._port.set.bind(this._port));

    // await portSet({rts: true});
    // await waitPortFlags(this._port, {cts: true});

    this._port.write(toBuffer(buf));
    await portDrain();
    console.log(chalk.red('PHYS: WRITE+DRAIN'));
  }

  async read({tout = TIMEOUT} = {}) {
    if (!this._port)
      return;
    const portSet = promisify(this._port.set.bind(this._port));

    // await portSet({cts: true});
    // await waitPortFlags(this._port, {cts: true});

    const buf = await waitForQueue(this._rxQueue, tout);
    return toArrayBuffer(buf);
  }
}


module.exports = {
  PhysicalConnection
};
