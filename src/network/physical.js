import SerialPort from "serialport";
import {promisify} from "util";
import delay from "delay";
import {timeout} from "promise-timeout";

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

export class PhysicalConnection {
  constructor() {
    this._port = null;
  }

  async connect(path, {tout = TIMEOUT} = {}) {
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
    await portSet({dtr: true});
    await waitPortFlags(this._port, {dsr: true, dcd: true});
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

    await portSet({rts: true});
    await waitPortFlags(this._port, {cts: true});
    this._port.write(buf);
    await portDrain(buf);
  }

  async read({tout = TIMEOUT} = {}) {
    return timeout(this._read(), tout);
  }

  async _read() {
    if (!this._port)
      return;
    const portSet = promisify(this._port.set.bind(this._port));

    await portSet({cts: true});
    await waitPortFlags(this._port, {cts: true});

    return this._port.read();
  }
}
