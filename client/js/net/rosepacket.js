function _ppBuffer(buf, buflen) {
  var out = '';
  for (var i = 0; i < buflen; ++i) {
    if (i>0) out += ' ';
    var byte = buf[i].toString(16);
    if (byte.length < 2) {
      byte = '0' + byte;
    }
    out += byte;
  }
  return out;
}

/**
 * @constructor
 */
function RosePacket(cmd) {
  this.cmd = cmd;
  this.dataLength = 0;
  this.data = new Uint8Array(4096);
  this.readPos = 0;
  this.view = new DataView(this.data.buffer);
}

RosePacket.prototype.setInt8 = function(pos, val) {
  this.view.setInt8(pos, val);
};
RosePacket.prototype.setInt16 = function(pos, val) {
  this.view.setInt16(pos, val, true);
};
RosePacket.prototype.setInt32 = function(pos, val) {
  this.view.setInt32(pos, val, true);
};
RosePacket.prototype.setUint8 = function(pos, val) {
  this.view.setUint8(pos, val);
};
RosePacket.prototype.setUint16 = function(pos, val) {
  this.view.setUint16(pos, val, true);
};
RosePacket.prototype.setUint32 = function(pos, val) {
  this.view.setUint32(pos, val, true);
};
RosePacket.prototype.setUint64 = function(pos, val) {
  this.setUint32(pos, val.lo);
  this.setUint32(pos+4, val.hi);
};
RosePacket.prototype.setFloat = function(pos, val) {
  this.view.setFloat32(pos, val, true);
};

RosePacket.prototype.addInt8 = function(val) {
  this.view.setInt8(this.dataLength, val);
  this.dataLength += 1;
};
RosePacket.prototype.addInt16 = function(val) {
  this.view.setInt16(this.dataLength, val, true);
  this.dataLength += 2;
};
RosePacket.prototype.addInt32 = function(val) {
  this.view.setInt32(this.dataLength, val, true);
  this.dataLength += 4;
};
RosePacket.prototype.addUint8 = function(val) {
  this.view.setUint8(this.dataLength, val);
  this.dataLength += 1;
};
RosePacket.prototype.addUint16 = function(val) {
  this.view.setUint16(this.dataLength, val, true);
  this.dataLength += 2;
};
RosePacket.prototype.addUint32 = function(val) {
  this.view.setUint32(this.dataLength, val, true);
  this.dataLength += 4;
};
RosePacket.prototype.addUint64 = function(val) {
  this.addUint32(val.lo);
  this.addUint32(val.hi);
};
RosePacket.prototype.addFloat = function(val) {
  this.view.setFloat32(this.dataLength, val, true);
  this.dataLength += 4;
};
RosePacket.prototype.addString = function(val, noNullTerm) {
  for (var i = 0; i < val.length; i++) {
    this.addUint8(val.charCodeAt(i) & 0xFF);
  }
  if (!noNullTerm) {
    this.addUint8(0);
  }
};

RosePacket.prototype.getInt8 = function(pos) {
  return this.view.getInt8(pos);
};
RosePacket.prototype.getInt16 = function(pos) {
  return this.view.getInt16(pos, true);
};
RosePacket.prototype.getInt32 = function(pos) {
  return this.view.getInt32(pos, true);
};
RosePacket.prototype.getUint8 = function(pos) {
  return this.view.getUint8(pos, true);
};
RosePacket.prototype.getUint16 = function(pos) {
  return this.view.getUint16(pos, true);
};
RosePacket.prototype.getUint32 = function(pos) {
  return this.view.getUint32(pos, true);
};

RosePacket.prototype.skip = function(num) {
  this.readPos += num;
};
RosePacket.prototype.readInt8 = function() {
  var val = this.view.getInt8(this.readPos);
  this.readPos += 1;
  return val;
};
RosePacket.prototype.readInt16 = function() {
  var val = this.view.getInt16(this.readPos, true);
  this.readPos += 2;
  return val;
};
RosePacket.prototype.readInt32 = function() {
  var val = this.view.getInt32(this.readPos, true);
  this.readPos += 4;
  return val;
};
RosePacket.prototype.readUint8 = function() {
  var val = this.view.getUint8(this.readPos, true);
  this.readPos += 1;
  return val;
};
RosePacket.prototype.readUint16 = function() {
  var val = this.view.getUint16(this.readPos, true);
  this.readPos += 2;
  return val;
};
RosePacket.prototype.readUint32 = function() {
  var val = this.view.getUint32(this.readPos, true);
  this.readPos += 4;
  return val;
};
RosePacket.prototype.readUint64 = function() {
  var lo = this.readUint32();
  var hi = this.readUint32();
  return new Int64(lo, hi);
};
RosePacket.prototype.readFloat = function() {
  var val = this.view.getFloat32(this.readPos, true);
  this.readPos += 4;
  return val;
};
RosePacket.prototype.readVector2 = function() {
  var x = this.readFloat();
  var y = this.readFloat();
  return new THREE.Vector2(x, y);
};
RosePacket.prototype.readPartItem = function() {
  var item = {};

  // weird, those are int (32) on server side ... (TODO: review, probably a bitfield)
  item.itemNo = this.readUint8();
  item.gemOption1 = this.readUint8();
  item.socketCount = this.readUint8();
  item.refineGrade = this.readUint8();

  // item.itemNo = this.readUint32();
  // item.gemOption1 = this.readUint16();
  // item.gemOption2 = this.readUint16();
  // item.gemOption3 = this.readUint16();
  // item.socketCount = this.readUint8();
  // item.refineGrade = this.readUint16();
  // item.color = this.readUint32();
  return item;
};

// Bit fields are hell
// Each mask represents the number of bits on which read our data
const ITEM_TYPE_MASK = 0b11111; // 5
const ITEM_NUM_MASK  = 0b1111111111; // 10
const ITEM_GEMOPT_MASK = 0b111111111; // 9
const ITEM_DURA_MASK = 0b1111111; // 7
const ITEM_LIFE_MASK = 0b1111111111; // 10
const ITEM_GRADE_MASK = 0b1111; // 4

RosePacket.prototype.readVisItem = function() {
  var item = {};
  const itemInfo = this.readUint16();
  item.itemType = itemInfo & ITEM_TYPE_MASK;
  item.itemNo = (itemInfo >> 5) & ITEM_NUM_MASK;
  item.isCrafted = (itemInfo >> 15) & 1;
  return item;
};

RosePacket.prototype.readItem = function() {
  var item = this.readVisItem();

  const itemType = item.itemType;

  if (!itemType) {
      this.skip(4);
      return {};
  }

  if (itemType < 10 ) {
      const itemQualityInfo = this.readUint16();
      item.gemOption1 = itemQualityInfo & ITEM_GEMOPT_MASK;
      item.durability = (itemQualityInfo >> 9) & ITEM_DURA_MASK;

      const itemStatsInfo = this.readUint16();
      item.itemLife = itemQualityInfo & ITEM_LIFE_MASK;
      item.socketCount = (itemStatsInfo >> 10) & 1;
      item.isAppraised = (itemStatsInfo >> 11) & 1;
      item.refineGrade = (itemStatsInfo >> 12) & ITEM_GRADE_MASK;
  } else if (itemType < 31) {
      item.quantity = this.readUint32();
  } else {
      item.money = this.readUint32();
  }

  return item;
};

RosePacket.prototype.readDropItem = function() {
  var item = {};
  item.position = this.readVector2().divideScalar(100);
  item.item = this.readItem();
  item.objectIdx = this.readUint16();
  item.ownerObjectIdx = this.readUint16();
  return item;
};
RosePacket.prototype.readString = function() {
  var startPos = this.readPos;
  while (this.readUint8());
  var strArray = this.data.subarray(startPos, this.readPos - 1);
  return String.fromCharCode.apply(null, strArray);
};

RosePacket.prototype.isReadEof = function() {
  return this.readPos >= this.dataLength;
};

RosePacket.prototype.toBuffer = function() {
  var outBuf = new Uint8Array(6 + this.dataLength);
  var outView = new DataView(outBuf.buffer);
  outView.setUint16(0, outBuf.length, true);
  outView.setUint16(2, this.cmd, true);
  outView.setUint16(4, 0x58d1, true);
  for (var i = 0; i < this.dataLength; ++i) {
    outBuf[6+i] = this.data[i];
  }
  return outBuf;
};

RosePacket.prototype.toString = function(maxLen) {
  return _ppBuffer(this.data, maxLen);
};

module.exports = RosePacket;
