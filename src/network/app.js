const {DataConnection} = require("./data");

const PACKET_SIZE_TYPE     = 8;
const PACKET_SIZE_FILENAME = 128;

const PACKET_OFFS_TYPE     = 0;
const PACKET_OFFS_FILENAME = PACKET_OFFS_TYPE + PACKET_SIZE_TYPE;
const PACKET_OFFS_FILEDATA = PACKET_OFFS_FILENAME + PACKET_SIZE_FILENAME;

const TYPE_FILE = 1;
const TYPES_MAX = 1;

class PacketError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

function strToBuf(str, cap) {
  const buf = new ArrayBuffer(cap);
  const bufView = new Uint16Array(buf);
  for (let i = 0; i < Math.max(str.length, cap/2-1); i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function bufToStr(buf) {
  const len = buf.indexOf(0);
  const bufCut = buf.slice(0, len);
  return String.fromCharCode.apply(null, bufCut);
}

function packetMakeFile(filename, filedata) {
  const packetLen = PACKET_SIZE_TYPE + PACKET_SIZE_FILENAME + filedata.byteLength;
  const packetBuf = new ArrayBuffer(packetLen);
  const packetBufView = new DataView(packetBuf);
  const packetBufUint8View = new Uint8Array(packetBuf);

  packetBufView.setUint8(PACKET_OFFS_TYPE, TYPE_FILE);
  const filenameBuf = strToBuf(filename, PACKET_SIZE_FILENAME);
  packetBufUint8View.set(new Uint8Array(filenameBuf), PACKET_OFFS_FILENAME/8);
  packetBufUint8View.set(filedata, PACKET_OFFS_FILEDATA/8);

  return packetBuf;
}

function packetParseFile(packetBuf) {
  const packetBufView = new DataView(packetBuf);

  if (!(packetBuf.byteLength > PACKET_SIZE_TYPE + PACKET_SIZE_FILENAME))
    throw new PacketError('bad header size');

  const type = packetBufView.getUint8(PACKET_OFFS_TYPE);
  if (!(0 <= type && type <= TYPES_MAX))
    throw new PacketError('bad type');

  // const filename = bufToStr(packetBuf.slice(PACKET_OFFS_FILENAME, PACKET_OFFS_FILENAME + PACKET_SIZE_FILENAME));
  const filedata = packetBuf.slice(PACKET_OFFS_FILEDATA);

  return {filedata};
}

class AppConnection {
  constructor() {
    this._data = null;
  }

  async accept(path) {
    console.log('accept', path, this._data);
    if (this._data)
      return;

    this._data = new DataConnection();
    try {
      await this._data.accept(path);
    } catch (e) {
      this._data = null;
      throw e;
    }
  }

  async connect() {
    if (!this._data)
      throw Error('not accepting');

    await this._data.connect();
  }

  async close() {
    if (!this._data)
      return;

    try {
      await this._data.close();
    } finally {
      this._data = null;
    }
  }

  async sendFile(filename, filedata) {
    if (!this._data || !this._data.isConnected())
      throw Error('not connected');

    try {
        let buf = packetMakeFile(filename, filedata);
        await this._data.write(buf)
    } catch (e) {
      console.log(e.stack);
      throw e;
    }
  }

  async recvFile() {
    if (!this._data || !this._data.isConnected())
      throw Error('not connected')

    const buf = await this._data.read();
    console.log('RECV FILE', buf);

    try {
      return packetParseFile(buf);
    } catch(e) {
      console.log(e.stack);
      throw e;
    }
  }
}


module.exports = {
  AppConnection
};
