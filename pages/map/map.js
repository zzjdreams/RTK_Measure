// pages/map/map.js
var promise=require('../../utils/promise.js')
var amapFile = require('../../libs/amap-wx.js'); //如：..­/..­/libs/amap-wx.js
var config = require('../../libs/config.js');
import BleHelper from '../../BLE/BleHelper.js'

var myAmapFun = new amapFile.AMapWX({ //输入高德地图key
  key: config.Config.key
});
var mapCtx = wx.createMapContext('map') //绑定地图
var full=false; //判断是否全屏显示

var ble=new BleHelper();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pointMsg : [],
    latitude:0,
    longitude:0,
    speed:0,
    accuracy:0,
    scale:14,
    mapHight:55,
    subkey:"GS7BZ-CCYR3-55P3H-YXAL3-QFUB2-C7FLE",
    markers: [{
      iconPath: "../../images/marker.svg",
      id: 0,
      latitude: 23.099994,
      longitude: 113.324520,
      width: 50,
      height: 50
    }],
    polyline: [{
      points: [{
        longitude: 113.3245211,
        latitude: 23.10229
      }, {
        longitude: 113.324520,
        latitude: 23.21229
        }, 
        {
          longitude: 111.324520,
          latitude: 23.21229
        }, {
          longitude: 112.324520,
          latitude: 23.21229
        }],
      
      color: "#FF0000DD",
      width: 2,
      dottedLine: true,
      arrowLine:true,
      control_location:true,
      control_compass:true
    }],
    controls: {
      id: 1,
      iconPath: '../../images/marker.svg',
      position: {
        left: 0,
        top: 300 - 50,
        width: 50,
        height: 50
      },
      clickable: true
    },
    circle:[{
      latitude: 114.246884,
      longitude: 22.720889,
      color:'#0f0',
      fillColor:'#aaa',
      radius:150,
      strokeWidth:3
    }],
    section_display:'block',
    controlIndex:0,
    screenInfo:[{
      id:'full_screen',
      src:'../../images/full_screen.svg',
      name:'全屏'
    },{
        id: 'min_screen',
        src: '../../images/min_screen.svg',
        name: '缩小'
    }]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const self=this;

    ble.openBluetoothAdapter();

    // ble.onBluetoothAdapterStateChange();
    

    self.getLocate();
    myAmapFun.getPoiAround({
      success: function (data) {
        //成功回调
        console.log('getPoiAround', data)
      },
      fail: function (info) {
        //失败回调
        console.log(info)
      }
    })
    wx.request({
      url: 'https://www.euref-ip.net',
      method:'GET',
      success:function(res){
        var codeData=[];
        var strArry=[];
        
        var splitTemp;
        // console.log(res.data)
        codeData=res.data.split('\r\n')
        // console.log(codeData)
        for(var i in codeData){     
          // console.log(codeData[i])
          if(codeData[i].includes("STR")){
            strArry.push(codeData[i])
          }
        }
        for(var i in strArry){
          // console.log(strArry[i]);
          splitTemp=strArry[i].split(";");
          self.data.pointMsg.push({
            mountpoint:splitTemp[1],
            identifier: splitTemp[2],
            diff_data: splitTemp[3],
            time_data: splitTemp[4],
            carrier_phase: splitTemp[5],
            nav_sys: splitTemp[6],
            net: splitTemp[7],
            country: splitTemp[8],
            latitude: splitTemp[9],
            longitude: splitTemp[10],
            nmea: splitTemp[11],
            base_type: splitTemp[12],
            software: splitTemp[13],
          })
          // console.log(self.data.pointMsg[i])
        }
        self.setData(self.data)
      },
      fail:function(res){
        console.log(res)
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  getLocate:function(){
    const self=this;
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy
        console.log(res)
        self.setData({
          latitude: latitude,
          longitude: longitude,
          speed: speed,
          accuracy: accuracy
        })
      }
    })
  },
  regionchange(e) {
    // console.log(e)
    myAmapFun.getRegeo({
      success: function (res) {
        // console.log('diliu', res)
      }
    });
  },
  markertap(e) {
    console.log(e.detail.markerId)
  },
  controltap(e) {
    console.log(e.detail.controlId)
  },
  bindInput: function (e) {
    var that = this;
    var keywords = e.detail.value;
    var key = config.Config.key;
    myAmapFun.getInputtips({
      keywords: keywords,
      location: '',
      success: function (data) {
        if (data && data.tips) {
          that.setData({
            tips: data.tips
          });
        }

      }
    })
  },
  bindSearch: function (e) {
    const that=this;
    var keywords = e.target.dataset.keywords;
    console.info(e)
    var url = '../poi/poi?keywords=' + keywords;
    console.log(url)
    that.setData({
      tips: []
    });
    // wx.redirectTo({
    //   url: url
    // })
  },

  drawMarker(latitude, longitude){
    var that = this;   
    var id = that.data.markers.length;
    that.mapCtx = wx.createMapContext('map')
    var centerLng = promise.wxPromisify(this.mapCtx.getCenterLocation);
    centerLng().then(
      //成功数据
      function (res) {
        console.log(res)
        latitude = res.latitude;
        longitude = res.longitude;
        that.data.markers.push({
          iconPath: "../../images/marker.svg",
          id: id,
          latitude: res.latitude,
          longitude: res.longitude,
          width: 30,
          height: 30
        })
        that.setData(that.data)
        console.log(that.data.markers)
      },
      //错误数据
      function (err) { console.log(err) }) 
  },

  moveToLocation: function () {
    var that=this;
    that.mapCtx = wx.createMapContext('map')
    // that.mapCtx.getRegion({
    //   success:function(res){
    //     console.log('quyu',res)
    //   },
    //   fail:function(res){
    //     console.log(res)
    //   }
    // })
    setTimeout(function () {
      var lng = that.getCenterLocation();
      console.log(lng)
      that.mapCtx.moveToLocation({
        longitude: 0,
        latitude: 0,
        success: function (res) {
          console.log('moveTo', res)
        },
        fail: function (res) {
          console.log('moveTo', res)
        }
      });
      // console.log(mapCtx)
    }, 1000)
  },
  translateMarker: function () {
    this.mapCtx.translateMarker({
      markerId: 0,
      autoRotate: true,
      duration: 1000,
      destination: {
        latitude: 23.10229,
        longitude: 113.3345211,
      },
      animationEnd() {
        console.log('animation end')
      }
    })
  },
  includePoints: function () {
    this.mapCtx.includePoints({
      padding: [10],
      points: [{
        latitude: 23.10229,
        longitude: 113.3345211,
      }, {
        latitude: 23.00229,
        longitude: 113.3345211,
      }]
    })
  },
  fullScreen:function(e){
    const self=this;
    if(!full){
      self.setData({
        controlIndex:1,
        mapHight: 100,
        section_display:'none'
      })
      full=true;
    }else{
      self.setData({
        controlIndex:0,
        mapHight: 55,
        section_display:'block'
      })
      full=false;
    }
  }
})