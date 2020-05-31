function xorify(startValue, del) {
  let current = startValue;

  while (current.toString(2).length >= del.toString(2).length) {
    const bitsDiff = current.toString(2).length - del.toString(2).length;
    const xorFirst = current >> bitsDiff;
    const xorResult = xorFirst ^ del;

    current = (xorResult << bitsDiff) | (~(0b1 << (bitsDiff + 1)) & current);

    const firstPart = xorResult << bitsDiff;
    const secondPart = parseInt('1'.repeat(bitsDiff), 2) & current;

    current = firstPart | secondPart;
  }

  return current;
}

function encode(toEncode, polynome, n, k) {
  let mx = toEncode << (n - k);
  let px = xorify(mx, polynome);

  return mx ^ px;
}

function decode(toDecode, polynome) {
  return xorify(toDecode, polynome);
}

function checksumCRC(buf) {
  return require('crc-32').buf(new Uint8Array(buf));
}

module.exports = {
  checksumCRC
};

