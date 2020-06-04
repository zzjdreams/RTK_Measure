// pages/bleSearch/bleSearch.js
const app = getApp()
const myWatch = require("../../utils/watch.js");
const base64 = require("../../utils/Base64Helper.js");
const writeHelper = require('../../utils/WriteHelper.js')
import BleHelper from '../../BLE/BleHelper.js'
import ParseData from '../../utils/ParseData.js'

var ble=new BleHelper();
var parse=new ParseData();
var isMove = false;

var s='';
Page({

  /**
   * 页面的初始数据
   */

  data: {
    // mark 是指原点x轴坐标
    mark: 0,
    // newmark 是指移动的最新点的x轴坐标 
    newmark: 0,
    istoright: 0,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    open: false,
    devices: [{
      deviceId: 2
    }, {
      deviceId: 2
    }, {
      deviceId: 2
    }],
    commdata:'$ICEGPS,FACTORY,GETVER*48',
    receiveData:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.showUserInfo();
    // parse.onReceiveBLE();
    // parse.outputMsg ="$ICEGPS,FACTORY,GETFWVER*59\r\n"
   
  
    // console.log(ble)
    myWatch.watch(app.bleListener, "devices", this.bleList);
    // myWatch.watch(app.bleListener, "receiveData", this.bleReceive);

    for(var i =0;i<1000;i++){
      s+=i+'\t';
      if(i%10==0){
        s+='\r\n';
      }
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
   
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },


  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  showUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },

  tap_ch: function(e) {
    if (this.data.open) {
      this.setData({
        open: false
      });
    } else {
      this.setData({
        open: true
      });
    }
    console.log(this.data.open)
  },

  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  tap_start: function(e) {
    // touchstart事件
    this.data.mark = this.data.newmark = e.touches[0].pageX;
    // console.log('tap_start',e.touches[0].pageX)
  },
  tap_drag: function(e) {
    isMove = true;
    // touchmove事件

    /*
     * 手指从左向右移动
     * @newmark是指移动的最新点的x轴坐标 ， @mark是指原点x轴坐标
     */
    this.data.newmark = e.touches[0].pageX;
    if (this.data.mark < this.data.newmark) {
      this.data.istoright = 1;
    }
    /*
     * 手指从右向左移动
     * @newmark是指移动的最新点的x轴坐标 ， @mark是指原点x轴坐标
     */
    if (this.data.mark > this.data.newmark) {

      this.data.istoright = -1;

    }
    this.data.mark = this.data.newmark;
  },
  tap_end: function(e) {
    if (isMove) {
      // touchend事件
      this.data.mark = 0;
      this.data.newmark = 0;
      switch (this.data.istoright) {
        case -1:
          this.setData({
            open: false
          });
          break;
        case 1:
          this.setData({
            open: true
          });
        default:
          break;
      }
      // if (this.data.istoright) {
      //   this.setData({
      //     open: true
      //   });
      // } else {
      //   this.setData({
      //     open: false
      //   });
      // }
      // console.log(this.data.istoright, this.data.open)
    }

    isMove = false;
  },
 

  bleList: function(devices_) {
    this.setData({
      devices: devices_
    })
    // console.info(devices_)
  },

  bleReceive:function(data){
    this.setData({
      receiveData: data
    })
  },

  startSearch() {
    ble.openBluetoothAdapter();
    ble.onBluetoothAdapterStateChange();
    ble.startBluetoothDevicesDiscovery();
  },
  stopSearch() {
    if(ble.discovering_){
      ble.stopBluetoothDevicesDiscovery();
    }
    if(ble.isConnected){
      ble.closeBLEConnection();
      app.bleListener.devices=[];
    }
    ble.closeBluetoothAdapter();
  },
  createBLEConnection(e) {
    ble.createBLEConnection(e.currentTarget.dataset.deviceId)
    console.log(e.currentTarget.dataset.deviceId);
    // ble.writeBLECharacteristicValue(writeHelper.write(writeHelper.GET_VER))
    // new Promise(function (resolve, reject) {
    //   ble.createBLEConnection(e.currentTarget.dataset.deviceId)
    // }).then(ble.writeBLECharacteristicValue(writeHelper.write(writeHelper.GET_VER)));
  },
  sendMsg(){
    // console.log(s)
  //  console.log(writeHelper.stringToBytes(s))
    // ble.writeBLECharacteristicValue( writeHelper.stringToBytes(s))
    ble.writeBLECharacteristicValue( writeHelper.stringToBytes(this.data.commdata+'\r\n'))
  },
  test(){
    ble.setBLEMTU(50);
    parse.transit("$ICEGPS,VERSION,AS210BD,123456789,1.6.1.6_test23a,UB482,P900,1577694030*20\r\n")
  },
  keylistener(e){
    // console.log(e.detail.value)
    this.setData({
      commdata:e.detail.value
    })
  },
  clearComm(){
    this.setData({
      commdata:''
    })
    app.bleListener.receiveData='';
    
  }


})


    