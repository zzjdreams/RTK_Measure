const logUtil = require('./logUtil.js')
const strUtil = require('./StrUtil.js')
var oldDatas = [];
var int8 = 8;
var q; //偏移位置
var cka;
var ckb;
var dataLenght = 0; //数据总长度
var clazz = null;
var id = null;

var dataView; //用来存放DataView可见视图
var arrayBuffer; //字节流缓存区，用来确定容量
var int8Array; //临时存放字节流
var int16Array; //临时存放字节流
var int32Array; //临时存放字节流
var int64Array; //临时存放字节流

var writeTimer;

/**
 * 密钥激活指令
 */
var DIS_CONNECT = "$ICEGPS,CONNECT,0";
var GET_VER = "$ICEGPS,FACTORY,GETVER";
var GET_UID = "$ICEGPS,FACTORY,GETUID";
var GET_FWVER = "$ICEGPS,FACTORY,GETFWVER";
var FACTORY_KEY = "$ICEGPS,FACTORY,KEY,";
var SN = "$ICEGPS,FACTORY,SN,";
var BOOT = "$ICEGPS,FACTORY,RECOVERY";

/**
 * 网络基站指令
 */
var GET_PROTOCOL = "$ICEGPS,GETPROTOCOL";
var GET_VER2 = "$ICEGPS,GETVER";
var GET_CONNECTMODE = "$ICEGPS,GETCONNECTMODE";
var SET_CONNECTMODE = "$ICEGPS,SETCONNECTMODE,";
var GET_WIFI = "$ICEGPS,GETWIFI";
var SET_WIFI = "$ICEGPS,SETWIFI,";
var GET_ETHMODE = "$ICEGPS,GETETHMODE";
var SET_ETHMODE = "$ICEGPS,SETETHMODE,";
var GET_ETHSTATIC = "$ICEGPS,GETETHSTATIC";
var SET_ETHSTATIC = "$ICEGPS,SETETHSTATIC,";
var GET_SERVER = "$ICEGPS,GETSERVER";
var SET_SERVER = "$ICEGPS,SETSERVER,";
var GET_BASECOORDINATE = "$ICEGPS,GETBASECOORDINATE";
var SET_BASECOORDINATE = "$ICEGPS,SETBASECOORDINATE,";
var GET_BASESTATUS = "$ICEGPS,GETBASESTATUS";
var SET_DATAFREQUENCY = "$ICEGPS,SETDATAFREQUENCY,";
var SETMQTT = "$ICEGPS,SETMQTT,-1,-1,-1,-1,";

function write(cmd) {
  let buffer = stringToBytes(addCheckSum(cmd));
  return buffer;
}


//计算校验和
function addCheckSum(s) {
  var sum = 0;
  for (var i = 1; i < s.length; i++) {
    sum ^= (s.charAt(i)).charCodeAt();
  }
  var hexNum = sum.toString(16);
  logUtil.log(hexNum)
  return s + "*" + hexNum + "\r\n";
}

// 字符串转byte
function stringToBytes(str) {
  var array = new Uint8Array(str.length);
  for (var i = 0, l = str.length; i < l; i++) {
    array[i] = str.charCodeAt(i);
  }
  logUtil.log(array);
  return array.buffer;
}

//设置延迟
function delay(ms, res) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve(res);
    }, ms);
  });
}

//移除掉数组中不含‘$’和‘\n’的项
function removeArray(array) {
  if (array != null) {
    for (var i = 0; i < array.length; i++) {
      if (((array[i].indexOf('$') == -1) || (array[i].indexOf('\n') == -1))) {
        array.splice(i, 1);
      }
    }
  }
}

/**
 * datas为object类型。其中组成可以为
 * [{data:3366,type:'Short'},{data:3366,type:'Int'},{data:336.6,type:'Float'},{data:336.545458586,type:'Double'},
 * {data:3321466,type:'Long'},{data:[3][4][5],type:'Array'}]
 */

function getDatasLen(datas) {
  var len = 0;
  for (var i in datas) {
    switch (datas[i].type) {
      case 'Byte':
        len += 1;
        break;
      case 'Short':
        len += 2;
        break;
      case 'Int':
        len += 4;
        break;
      case 'Float':
        len += 4;
        break;
      case 'Double':
        len += 8;
        break;
      case 'Long':
        len += 8;
        break;
      case 'Array':
        len += datas[i].data.byteLength;
        break;
      default:
        break;
    }
  }
  dataLenght = len;
  return len;
}


function writeHexComm(clazz, id, datas) {
  arrayBuffer = new ArrayBuffer(getDatasLen(datas) + int8);
  dataView = new DataView(arrayBuffer);
  // byteBuffer = new Uint8Array(arrayBuffer)
  // strUtil.hexString2ArrayBuffer('B5');
  //添加头数据
  addHeader(clazz, id);
  appendDatas(datas);
  appendFoot();
  // console.log(clazz+'==='+id+'===',arrayBuffer)
  return arrayBuffer;
}

//model是2字节、size是4字节、checksum是2字节
// function writeFirstComm(clazz, id, model, size, checksum) {
//   var arrayLen =2+4+2;
//   buf = new ArrayBuffer(arrayLen + int8);
//   byteBuffer = new DataView(buf,0,true);
//   appedHeader(clazz, id);
//   appendCheckData(model,size,checksum);
//   appendFoot();
//   return byteBuffer;
// }

function addHeader(clazz1, id1) {
  q = 0;
  cka = 0;
  ckb = 0;
  dataView.setInt8(q++, 0xB5);
  dataView.setInt8(q++, 0x62);
  clazz = clazz1;
  id = id1;
  dataView.setInt8(q++, clazz1);
  dataView.setInt8(q++, id1);
  // console.log('header', arrayBuffer)
}

function appendDatas(datas) {
  dataView.setInt16(q, dataLenght, true);
  q += 2;
  for (var i in datas) {
    switch (datas[i].type) {
      case 'Byte':
        // int16Array = new Int16Array([datas[i].data]);
        // dataView.setInt8(q, int16Array, false);
        dataView.setInt8(q, datas[i].data, true);
        q += 1;
        break;
      case 'Short':
        // int16Array = new Int16Array([datas[i].data]);
        // dataView.setInt8(q, int16Array, false);
        dataView.setInt16(q, datas[i].data, true);
        q += 2;
        break;
      case 'Int':
        // int32Array = new Int32Array([datas[i].data]);
        // dataView.setInt8(q, int32Array, false);
        dataView.setInt32(q, datas[i].data, true);
        q += 4;
        break;
      case 'Float':
        // int32Array = new Int32Array([datas[i].data]);
        // dataView.setInt32(q, int32Array, false);
        dataView.setInt32(q, datas[i].data, true);
        q += 4;
        break;
      case 'Double':
        // int64Array = new IntBig64Array([datas[i].data]);
        // dataView.setBigInt64(q, int64Array, false);
        dataView.setBigInt64(q, datas[i].data, true);
        q += 8;
        break;
      case 'Long':
        // int64Array = new IntBig64Array([datas[i].data]);
        // dataView.setBigInt64(q, int64Array, false);
        dataView.setBigInt64(q, datas[i].data, true);
        q += 8;
        break;
      case 'Array':
        // q += datas[i].data.byteLength;
        var array = Array.prototype.slice.call(new Uint8Array(datas[i].data))
        for (var byte in array) {
          dataView.setInt8(q++, array[byte])
        }
        break;
      default:
        break;
    }
    // console.log(datas[i].type, datas[i].data)
  }
  // console.log('datas', arrayBuffer)
}

// function appendCheckData(model, size, checksum){
//   q+=2;
//   byteBuffer.setUint8(q, model);
//   q+=2;
//   byteBuffer.setUint8(q, size);
//   q+=2;
//   byteBuffer.setUint8(q++, checksum);
// }

function appendFoot() {
  for (var i = 2; i < q; i++) {
    var j = dataView.getUint8(i);
    j &= 0x00FF;
    cka += j;
    cka &= 0x00FF;
    ckb += cka;
    ckb &= 0x00FF;
  }
  dataView.setInt8(q++, cka);
  dataView.setInt8(q++, ckb);
  // console.log('foot', arrayBuffer)
}

function writeData(clazz, id, datas, fn) {
  if (clazz != 0x05) {
    if (writeTimer != null) {
      clearTimeout(writeTimer);
    }
    writeTimer = setTimeout(function() {
      writeData(clazz, id, datas)
    }, 3000) //延迟时间 这里是3秒 
  }
  writeHexComm(clazz, id, datas);
}

var repeatSentTimer;
var isWork=false;
/**
 * 重复发送数据
 * @param judgement:判决条件
 * @param comm:arrayBuffer数据
 */
function repeatSendData(judgement,comm){
  oldDatas.push({judgement:judgement,comm:comm});
  if(!isWork){
    isWork=true;
    repeatSentTimer = setInterval(() => {
      if (oldDatas.length < 1) {
        clearInterval(repeatSentTimer);
        isWork=false;
      }else{
        if (oldDatas[0].judgement != '') {
          oldDatas.shift();
        } else {
          console.log(oldDatas[0].comm);
        }
      }     
    }, 3000)
  }
}

// repeatSendData(a>b,'第1组')
// repeatSendData(a == b, '第2组')
// repeatSendData(a < b, '第3组')
// repeatSendData(a ==100, '第4组')


module.exports = {
  addCheckSum: addCheckSum,
  write: write,
  delay: delay,
  // writeFirstComm: writeFirstComm,
  writeHexComm: writeHexComm,

  removeArray: removeArray,
  DIS_CONNECT: DIS_CONNECT,
  GET_VER: GET_VER,
  GET_UID: GET_UID,
  GET_FWVER: GET_FWVER,
  FACTORY_KEY: FACTORY_KEY,
  SN: SN,
  BOOT: BOOT,

  GET_PROTOCOL: GET_PROTOCOL,
  GET_VER2: GET_VER2,
  GET_CONNECTMODE: GET_CONNECTMODE,
  SET_CONNECTMODE: SET_CONNECTMODE,
  GET_WIFI: GET_WIFI,
  SET_WIFI: SET_WIFI,
  GET_ETHMODE: GET_ETHMODE,
  SET_ETHMODE: SET_ETHMODE,
  GET_ETHSTATIC: GET_ETHSTATIC,
  SET_ETHSTATIC: SET_ETHSTATIC,
  GET_SERVER: GET_SERVER,
  SET_SERVER: SET_SERVER,
  GET_BASECOORDINATE: GET_BASECOORDINATE,
  SET_BASECOORDINATE: SET_BASECOORDINATE,
  GET_BASESTATUS: GET_BASESTATUS,
  SET_DATAFREQUENCY: SET_DATAFREQUENCY,
  SETMQTT: SETMQTT,
}