const SerialPort = require("serialport");
const {promisify} = require("util");
const delay = require("delay");
const {timeout} = require("promise-timeout");

const TIMEOUT = 1000;
const FLAG_DELAY = 100;

async function waitPortFlags(port, {dsr = false, dcd = false, cts = false} = {}) {
  const portGet = promisify(port.get.bind(port));

  while (true) {
    const flags = await portGet();
    let ok = true;
    if (dsr && !flags.dsr) ok = false;
    if (dcd && !flags.dcd) ok = false;
    if (cts && !flags.cts) ok = false;
    if (ok)
      break;
    await delay(FLAG_DELAY);
  }
  return true;
}

async function waitForRead(port) {
  while (true) {
    const buff = port.read();
    if (!buff) {
      await delay(FLAG_DELAY);
      continue;
    }
    return buff;
  }
}

function toBuffer(ab) {
  const buf = Buffer.alloc(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

function toArrayBuffer(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

class PhysicalConnection {
  constructor() {
    this._port = null;
  }

  async connect(path, {tout = TIMEOUT} = {}) {
    console.log('physical connect', path);
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
    console.log('before prot set');
    // try {
    //     await portSet({});
    // } catch (e) {
    //   console.log(e.stack);
    // }

    console.log('after prot set');
    // await waitPortFlags(this._port, {dsr: true, dcd: true});
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
        }
      }
    }
  }

  async _close() {
    if (!this._port)
      return;
    const portClose = promisify(this._port.close.bind(this._port));
    const portSet = promisify(this._port.set.bind(this._port));

    await portSet({dtr: false, rts: false});
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
  }

  async read({tout = TIMEOUT} = {}) {
    return timeout(this._read(), tout);
  }

  async _read() {
    if (!this._port)
      return;
    const portSet = promisify(this._port.set.bind(this._port));

    // await portSet({cts: true});
    // await waitPortFlags(this._port, {cts: true});

    const buf = await waitForRead(this._port);
    return toArrayBuffer(buf);
  }
}


module.exports = {
  PhysicalConnection
};
