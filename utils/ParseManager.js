var app = getApp();

function removeSameArray(array){
  if(array.length>0){
    var temp = new Array;
      for (var index in array) {
        if (temp.indexOf(array[index] == -1)) {
          temp.push(array[index])
        }
      }
    return temp;
  }
  return [];
}

/**
 * 返回按逗号截取的数组
 */
function splitData(array) { //将数组中的最后一组信息按逗号分开来
  if (array.length > 0) {
    // console.log()
    var getComm = "";
    getComm = array[array.length - 1];
    var startIndex = getComm.indexOf('$');
    var endIndex = getComm.indexOf('*');
    return getComm.substring(startIndex + 1, endIndex).split(",");
  }
  return array;
}

function extractData(array) {
  var header = "";
  var type = "";
  var getSplitComm = array;
  if (getSplitComm.length == 0) {
    return;
  }
  if (getSplitComm[0] == "ICEGPS") {
    header = "ICEGPS"
    if (getSplitComm[1] == "VERSION") {
      type = "VERSION"
      app.globalData.machineType = getSplitComm[2];
      app.globalData.equipmentSN = getSplitComm[3];
      app.globalData.softwareVersion = getSplitComm[4];
      app.globalData.boardModel = getSplitComm[5];
      app.globalData.digitalTransmissionModel = getSplitComm[6];
      if (getSplitComm[7] == "OPEN") {
        app.globalData.activationInfo = "永久激活";
      } else {
        var dateTime = new Date(parseInt(getSplitComm[7]) * 1000);
        var year = dateTime.getFullYear();
        var month = dateTime.getMonth() + 1;
        var day = dateTime.getDate();
        var hour = dateTime.getHours();
        var minute = dateTime.getMinutes();
        var second = dateTime.getSeconds();
        app.globalData.activationInfo = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
      }
      return "获取版本号成功,可前往设备信息查看";
    } else if (getSplitComm[1] == "UID") {
      type = "UID"
      app.globalData.hardwareUID = getSplitComm[2];
      return "获取UID成功,可前往设备信息查看";
    } else if (getSplitComm[1] == "FACTORY") {
      if (getSplitComm[2] == "KEY") {
        type = "key"
        switch (getSplitComm[3]) {
          case "INVALID":
            app.globalData.activationKey = "无效密钥!";
            break;
          case "ERROR":
            app.globalData.activationKey = "激活失败!";
            break;
          case "OK":
            app.globalData.activationKey = "激活成功!";
            if (getSplitComm[4] == "OPEN") {
              app.globalData.activationKey += "\n永久激活!";
            } else {
              var dateTime = new Date(parseInt(getSplitComm[4]) * 1000);
              var year = dateTime.getFullYear();
              var month = dateTime.getMonth() + 1;
              var day = dateTime.getDate();
              var hour = dateTime.getHours();
              var minute = dateTime.getMinutes();
              var second = dateTime.getSeconds();
              app.globalData.activationKey += "\n有效期至:" + year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
            }
            break;
        }
      }
      return "获取成功";
    } else if (getSplitComm[1] == "CONNECTMODE") {
      app.globalData.connectMode = getSplitComm[2];
      return "获取成功";
    }else if (getSplitComm[1] == "WIFI") {
      app.globalData.wifiMsg = getSplitComm[2];
      app.globalData.wifiAccount = getSplitComm[2];
      app.globalData.wifiPassword = getSplitComm[3];
      return "获取成功";
    } else if (getSplitComm[1] == "ETHSTATIC") {
      app.globalData.ethernetMsg = getSplitComm[2];
      switch (getSplitComm[2]) {
        case '0':
          app.globalData.ethernetIP = getSplitComm[3] + '.' + getSplitComm[4] + '.' + getSplitComm[5] + '.' + getSplitComm[6];
          break;
        case '1':
          app.globalData.ethernetSubnetMask = getSplitComm[3] + '.' + getSplitComm[4] + '.' + getSplitComm[5] + '.' + getSplitComm[6];
          break;
        case '2':
          app.globalData.ethernetGateway = getSplitComm[3] + '.' + getSplitComm[4] + '.' + getSplitComm[5] + '.' + getSplitComm[6];
          break;
        case '3':
          app.globalData.ethernetDNS = getSplitComm[3] + '.' + getSplitComm[4] + '.' + getSplitComm[5] + '.' + getSplitComm[6];
          break;
      }
      return "获取成功";
    } else if (getSplitComm[1] == "ETHMODE") {
      app.globalData.ethernetAuto = getSplitComm[2];
      return "获取成功";
    } else if (getSplitComm[1] == "SERVER") {
      app.globalData.serverMsg = getSplitComm[2];
      app.globalData.serverPort = getSplitComm[2];
      app.globalData.serverIP = getSplitComm[3] + '.' + getSplitComm[4] + '.' + getSplitComm[5] + '.' + getSplitComm[6];
      return "获取成功";
    } else if (getSplitComm[1] == "MQTT") {
      app.globalData.mqtt = getSplitComm[2];
      app.globalData.serverAccount = getSplitComm[6];
      app.globalData.serverPassword = getSplitComm[7];
      return "获取成功";
    } else {
      return "获取失败--错误指令--请重新发送"
    }
  }
  return "获取失败--错误指令--请重新发送"
}

module.exports = {
  splitData: splitData,
  extractData: extractData,
  removeSameArray, removeSameArray
}