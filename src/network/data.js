const {PhysicalConnection} = require("./physical");
const {checksumCRC} = require("./crc");
const {TimeoutError} = require("promise-timeout");

// consts ==============================================================================================================

const PACKET_SIZE_CRC  = 32;
const PACKET_SIZE_TYPE = 8;
const PACKET_SIZE_LEN  = 32;
const HEADER_SIZE = PACKET_SIZE_CRC + PACKET_SIZE_TYPE + PACKET_SIZE_LEN;

const PACKET_OFFS_CRC  = 0;
const PACKET_OFFS_TYPE = PACKET_OFFS_CRC  + PACKET_SIZE_CRC;
const PACKET_OFFS_LEN  = PACKET_OFFS_TYPE + PACKET_SIZE_TYPE;
const PACKET_OFFS_DATA = PACKET_OFFS_LEN  + PACKET_SIZE_LEN;

const TYPE_CONNECT = 1;
const TYPE_FINISH  = 2;
const TYPE_DATA    = 3;
const TYPE_ACK     = 4;
const TYPE_RETRY   = 5;
const TYPES_MAX = 5;

const ENDIANNESS_LITTLE = true;

const STATE_NONE       = 1;
const STATE_ACCEPTING  = 2;
const STATE_CONNECTING = 3;
const STATE_CONNECTED  = 4;
const STATE_FINISHING  = 5;

// consts ^=============================================================================================================

// errors ==============================================================================================================

class PacketError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ConnectError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class CloseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class WriteError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ReadError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

// errors ^=============================================================================================================

// packet ==============================================================================================================

function packetMake(type, buf) {
  const bufLen = (buf) ? buf.byteLength : 0;
  const packetLen = HEADER_SIZE + bufLen;
  const packetBuf = new ArrayBuffer(packetLen);
  const packetBufView = new DataView(packetBuf);
  const packetBufUint8View = new Uint8Array(packetBuf);

  packetBufView.setUint8(PACKET_OFFS_TYPE, type);
  packetBufView.setUint32(PACKET_OFFS_LEN, bufLen, ENDIANNESS_LITTLE);
  if (bufLen)
    packetBufUint8View.set(buf, PACKET_OFFS_DATA/8);

  const crc = checksumCRC(packetBuf.slice(PACKET_OFFS_CRC + PACKET_SIZE_CRC));
  packetBufView.setUint32(PACKET_OFFS_CRC, crc, ENDIANNESS_LITTLE);

  return packetBuf;
}

function packetParse(packetBuf) {
  const packetBufView = new DataView(packetBuf);

  if (!(packetBuf.byteLength >= HEADER_SIZE))
    throw new PacketError('bad header size');

  const crc = packetBufView.getUint32(PACKET_OFFS_CRC, ENDIANNESS_LITTLE);
  const crcClient = checksumCRC(packetBuf.slice(PACKET_OFFS_CRC + PACKET_SIZE_CRC));
  if (crc !== crcClient)
    throw new PacketError('bad crc');

  const type = packetBufView.getUint8(PACKET_OFFS_TYPE);
  if (!(0 <= type && type <= TYPES_MAX))
    throw new PacketError('bad type');

  const len = packetBufView.getUint32(PACKET_OFFS_LEN, ENDIANNESS_LITTLE);
  if (len !== (packetBuf.byteLength - HEADER_SIZE))
    throw new PacketError('bad len');

  let buf = null;
  if (len)
    buf = packetBuf.slice(HEADER_SIZE);

  return {type, buf};
}

// packet ^=============================================================================================================

// conn ================================================================================================================

class DataConnection {
  constructor() {
    this._phys = null;
    this._state = STATE_NONE;
    this._txDataQueue = [];
    this._rxDataQueue = [];
  }

  async accept(path) {
    console.log('data accept');
    if (this._state !== STATE_NONE)
      return;

    this._phys = new PhysicalConnection();
    try {
      await this._phys.connect(path);
    } catch (e) {
      await this._close();
      throw e;
    }
    this._state = STATE_ACCEPTING;
  }

  async connect() {
    if (this._state !== STATE_ACCEPTING)
      return;

    console.log('data: connect');
    this._state = STATE_CONNECTING;

    while (this._state === STATE_CONNECTING)
      await this.loop();

    if (this._state !== STATE_CONNECTED)
      throw new ConnectError('failed connect');
  }

  async close() {
    if (this._state === STATE_NONE)
      return;

    if (this._state === STATE_CONNECTED) {
      this._state = STATE_FINISHING;
      this._txDataQueue = [];
      this._rxDataQueue = [];
      await this._write(TYPE_FINISH, null);

      while (this._state === STATE_FINISHING)
        await this.loop();
    }

    this._state = STATE_NONE;
    await this._close();
  }

  isAccepting() {
    return this._state !== STATE_NONE;
  }

  isConnected() {
    return this._state === STATE_CONNECTED;
  }

  async write(buf) {
    if (this._state !== STATE_CONNECTED)
      return;

    await this._write(TYPE_DATA, buf);
    this._txDataQueue.push(buf);

    while (this._txDataQueue.length)
      await this.loop();
    if (this._state !== STATE_CONNECTED)
      throw new WriteError('closed connection');
  }

  async read() {
    if (this._state !== STATE_CONNECTED)
      throw new ReadError('not connected');

    while (!this._rxDataQueue.length && this._state === STATE_CONNECTED)
      await this.loop();

    if (this._state !== STATE_CONNECTED)
      throw new ReadError('closed connection');

    return this._rxDataQueue.shift();
  }

  async loop() {
    console.log(`STATE BEGIN: state=${this._state}`)
    const r = await this._loop();
    console.log(`STATE END:   state=${this._state}`)
    console.log()
    return r;
  }

  async _loop() {
    if (this._state === STATE_NONE) {
      return;
    }

    if (this._state === STATE_ACCEPTING) {
      const {ok, type} = await this._read();
      if (!ok)
        return;

      if (type === TYPE_CONNECT) {
        this._state = STATE_CONNECTED;
        await this._write(TYPE_ACK, null);
      }
    }

    if (this._state === STATE_CONNECTING) {
      const {ok, type} = await this._read();
      if (!ok) {
        await this._write(TYPE_CONNECT, null);
        return;
      }

      if (type === TYPE_CONNECT) {
        this._state = STATE_CONNECTED;
        await this._write(TYPE_ACK, null);
        return;
      }

      if (type === TYPE_ACK) {
        this._state = STATE_CONNECTED;
        return;
      }

      this._state = STATE_ACCEPTING;
    }

    if (this._state === STATE_CONNECTED) {
      const {ok, type, buf} = await this._read();
      if (!ok)
        return;

      if (type === null) {
        await this._write(TYPE_RETRY, null);
      }

      if (type === TYPE_CONNECT) {
        this._txDataQueue = [];
        this._rxDataQueue = [];
        await this._write(TYPE_ACK, null);
      }

      if (type === TYPE_FINISH) {
        this._txDataQueue = [];
        this._rxDataQueue = [];
        this._state = STATE_ACCEPTING;
        await this._write(TYPE_ACK, null);
      }

      if (type === TYPE_DATA) {
        this._rxDataQueue.push(buf);
        await this._write(TYPE_ACK, null);
      }

      if (type === TYPE_ACK) {
        this._txDataQueue.splice(0, 1);
      }

      if (type === TYPE_RETRY) {
        if (this._txDataQueue.length) {
          await this._write(TYPE_DATA, this._txDataQueue[0]);
        }
      }
    }

    if (this._state === STATE_FINISHING) {
      const {ok} = await this._read();
      if (!ok)
        return;

      this._state = STATE_ACCEPTING;
    }
  }

  async _read() {
    let packetBuf = null;
    try {
      packetBuf = await this._phys.read();
    } catch (e) {
      if (e instanceof TimeoutError) {
        console.log('READ: timeout');
        return {ok: false, type: null, buf: null};
      }
      throw e;
    }

    let packet = null;
    try {
      packet = packetParse(packetBuf);
      console.log(`READ: type=${packet.type}`);
    } catch (e) {
      console.log(`READ: type=-1`);
      if (e instanceof PacketError)
        return {ok: true, type: null, buf: null};
      throw e;
    }

    return {ok: true, type: packet.type, buf: packet.buf};
  }

  async _write(type, buf) {
    console.log(`WRITE: type=${type}`);
    const packetBuf = packetMake(type, buf);
    this._phys.write(packetBuf);
  }

  async _close() {
    try {
      await this._phys.close();
    } finally {
      this._phys = null;
    }
  }
}

module.exports = {
  DataConnection
};

// conn ^===============================================================================================================
