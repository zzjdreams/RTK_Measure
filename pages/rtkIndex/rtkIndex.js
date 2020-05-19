var amapFile = require('../../libs/amap-wx.js'); //如：..­/..­/libs/amap-wx.js
// import ol from '../../miniprogram_npm/ol/index.js'
var markersData = [];
Page({
  data: {
    markers: [],
    latitude: '',
    longitude: '',
    textData: {}
  },
  makertap: function(e) {
    var id = e.markerId;
    var that = this;
    that.showMarkerInfo(markersData, id);
    that.changeMarkerColor(markersData, id);
  },
  onLoad: function() {
    var that = this;
    var myAmapFun = new amapFile.AMapWX({
      key: 'a781478fe804519561151526a7492599'
    });
    myAmapFun.getPoiAround({
      iconPathSelected: '../../images/local.png', //如：..­/..­/img/marker_checked.png
      iconPath: '../../images/marker.png', //如：..­/..­/img/marker.png
      success: function(data) {
        markersData = data.markers;
        that.setData({
          markers: markersData
        });
        that.setData({
          latitude: markersData[0].latitude
        });
        that.setData({
          longitude: markersData[0].longitude
        });
        that.showMarkerInfo(markersData, 0);
      },
      fail: function(info) {
        wx.showModal({
          title: info.errMsg
        })
      }
    });
    myAmapFun.getWeather({
      success: function (data) {
        //成功回调
        console.log(data)
      },
      fail: function (info) {
        //失败回调
        console.log(info)
      }
    })
    // wx.getLocation({
    //   type: 'wgs84', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
    //   success: function (res) {

    //     that.setData({
    //       latitude: res.latitude,
    //       longitude: res.longitude,
    //       markers: [{
    //         id: "1",
    //         latitude: res.latitude,
    //         longitude: res.longitude,
    //         width: 50,
    //         height: 50,
    //         iconPath: "../../images/local.png",
    //         title: "哪里"

    //       }],
    //       circles: [{
    //         latitude: res.latitude,
    //         longitude: res.longitude,
    //         color: '#FF0000DD',
    //         fillColor: '#7cb5ec88',
    //         radius: 3000,
    //         strokeWidth: 1
    //       }]

    //     })
    //   }

    // })

  },
  showMarkerInfo: function(data, i) {
    var that = this;
    that.setData({
      textData: {
        name: data[i].name,
        desc: data[i].address
      }
    });
  },
  changeMarkerColor: function(data, i) {
    var that = this;
    var markers = [];
    for (var j = 0; j < data.length; j++) {
      if (j == i) {
        data[j].iconPath = "../../images/local.png"; //如：..­/..­/img/marker_checked.png
      } else {
        data[j].iconPath = "../../images/marker.png"; //如：..­/..­/img/marker.png
      }
      markers.push(data[j]);
    }
    that.setData({
      markers: markers
    });
  }

})