
const base64 = require("../../utils/Base64Helper.js");
import ParseData from '../../utils/ParseData.js'
const strUtil = require('../../utils/StrUtil.js');

var parse = new ParseData()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isConnect: null,
  },

  startClick: function (even) {
    wx.connectSocket({
      url: 'ws://121.40.165.18:8800',
      method: 'GET',
      success: function () {
        isConnect: true
        console.log("连接成功...")
      },
      fail: function () {
        isConnect: false
        console.log("连接失败...")
      }
    });

    wx.onSocketOpen(function (res) {
      console.log('WebSocket连接已打开！')
    });

    wx.onSocketError(function (res) {
      console.log('WebSocket连接打开失败，请检查！')
    })
  },

  sendClick: function (even) {
    wx.sendSocketMessage({
      data: "微信小程序 web socket"
    })
  },

  closeClick: function (even) {
    wx.closeSocket({
      success: function () {
        console.log("关闭成功...")
      },
      fail: function () {
        console.log("关闭失败...")
      }
    });
    wx.onSocketClose(function (res) {
      console.log("WebSocket连接已关闭")
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log('parse', parse.onReceiveBLE())
    // wx.onSocketMessage(function (res) {
    //   console.log(res.data)
    // })
    //  this.httpConnect()
    // this.socketCommunicate()
    // this.funTest();
    // this.udpSocket();
    this.socketTest();
  },
  socketCommunicate: function () {
    var socketMsgQueue = [];
    // var msg = "GET / HTTP/1.0\r\n" +
    //   "User-Agent: NTRIP GNSSInternetRadio/1.4.10\r\n" +
    //   "Accept: */*\r\n" +
    //   "Connection: close\r\n";
    var header01 = {
      "GET": "HTTP/1.0",
      "User-Agent": "NTRIP GNSSInternetRadio/1.4.10",
      "Accept": "*/*",
      "Connection": "close"
    }
    // console.log(msg)
    wx.connectSocket({
      url: 'wss://203.107.45.154:8002',
      success: function (res) {
        console.log('conn suc', res)
        wx.onSocketOpen((res) => {
          console.log('open', res)
          socketOpen = true;
          wx.sendSocketMessage({
            data: header01
          })
          wx.onSocketMessage((data) => {
            console.log(data)
          })
        })

      },
      fail: function (res) {
        console.log('conn fail', res)
      },
      complete: function () {
        wx.onSocketError((err) => {
          console.log('err', err)
        })
      }
    })
  },

  httpConnect: function () {
    var header01 = {
      "GET": "HTTP/1.0",
      "User-Agent": "NTRIP GNSSInternetRadio/1.4.10",
      "Accept": "*/*",
      "Connection": "close"
    }
    var header02 = {
      "GET": "HTTP/1.0",
      "User-Agent": "NTRIP GNSSInternetRadio/1.4.10",
      "Accept": "*/*",
      "Connection": "close",
      "Authorization": base64.baseEncode("icertk0016:c70902d")+""
    }
    wx.request({
      url: 'http://203.107.45.154:8002/',
      data: header01,
      // header:header01,
      success: function (res) {
        console.log(1, res)
        wx.request({
          url: 'http://rtk.ntrip.qxwz.com:8002/',
          // data: header02,
          // header: header02,
          success: function (res) {
            console.log(2, res)
          },
          fail: function (res) {
            console.log(2, res)
          }
        })
      },
      fail: function (res) {
        console.log(1, res)
      }
    })
  },
  socketTest: function (res) {
    //发送的数据体
    var sendData = {
      "User-Agent": "NTRIP GNSSInternetRadio/1.4.10",
      "Accept": "*/*",
      "Connection": "close",
      // "Authorization": base64.baseEncode("icertk0016:c70902d")+"\r\n\r\n"
    }
    var sendData2 =
      "GET / HTTP/1.0\r\n" +
      "User-Agent: NTRIP GNSSInternetRadio/1.4.10\r\n" +
      "Accept: */*\r\n" +
      "Connection: close\r\n\r\n";
    //连接查找IP地址
    var wst = wx.connectSocket({
      url: 'wss://rtk.ntrip.qxwz.com:8002',
      // url: 'wss://echo.websocket.org',
      // protocols: ["HTTP/1.0"],
      // method:"GET",
      // header: sendData,
      timeout: 5000,
      success(res) {
        console.log("==1s==", res)
      },
      fail(res) {
        console.log("==1f==", res)
      }
    })
    console.log(wst)
    //进行连接
    wst.onOpen((res) => {
      console.log("open", res)
      //发送数据
      wst.send({
        data: sendData2,
        success(res) {
          console.log("==2s==", res)
        },
        fail(res) {
          console.log("==2f==", res)
        }
      });
      //接收数据
      wst.onMessage((res) => {
        console.log("msg", res)
      });
      // wst.close({
      //   success(res) {
      //     console.log("==3s==", res)
      //   },
      //   fail(res) {
      //     console.log("==3f==", res)
      //   }
      // });
    });
    //异常关闭处理
    wst.onClose((res) => {
      console.log("close", res)
    });
    wst.onError((res) => {
      console.log("error", res)
    })
  },

  funTest() {
    var sendData =
      "GET / HTTP/1.0\r\n" +
      "User-Agent: NTRIP GNSSInternetRadio/1.4.10\r\n" +
      "Accept: */*\r\n" +
      "Connection: close\r\n\r\n";

    //   wx.connectSocket({
    //     url: 'wss://203.107.45.154',
    //     header: {},
    //     method: 'GET',
    //     protocols: [],
    //     success: function(res) {
    //       console.log(res)

    //       wx.onSocketOpen((res) => {
    //         console.log('open', res)
    //         wx.sendSocketMessage({
    //           data: [sendData],
    //         })
    //         wx.onSocketMessage(function (res) {
    //           console.log(res)
    //         })
    //       })     
    //       // socketOpen = true;

    //     },
    //     fail: function(res) {console.log(res)},
    //     complete: function(res) {},
    //   })
    // },
    // socketTest:function(res){
    //   var wst=wx.connectSocket({
    //     url: 'wss://203.107.45.154:8002',
    //     success(res){
    //       console.log("==1s==", res)
    //     },
    //     fail(res){
    //       console.log("==1f==",res)
    //     }
    //   })

    //建立连接
    wx.connectSocket({
      url: "ws://203.107.45.154:8002",
      success(res) {
        //连接成功
        wx.onSocketOpen(function () {
          wx.sendSocketMessage({
            data: sendData,
            success(res) {
              console.log('send suc')
              //接收数据
              wx.onSocketMessage(function (data) {
                console.log(data);
              })

            },
            fail(res) {
              console.log('send fail')
            }
          })
        })
        },
      fail(res){
          console.log("==1f==",res)
        }
    })
    
    //连接失败
    wx.onSocketError(function () {
      console.log('websocket连接失败！');
    })

  },
  udpSocket:function(){
    var sendData =
      "GET / HTTP/1.0\r\n" +
      "User-Agent: NTRIP GNSSInternetRadio/1.4.10\r\n" +
      "Accept: */*\r\n" +
      "Connection: close\r\n\r\n";
    var udp = wx.createUDPSocket();
    udp.bind(8002)
    udp.send({
      address: '203.107.45.154',
      port: 8002,
      family: 'IPv6',
      message: sendData,

    })
    udp.onListening((res)=>{console.log(res)});
    udp.onMessage((res)=>{
      console.log(res)
      console.log(strUtil.arrayBuffer2String(res.message.data) )
    });
    udp.onError((res)=>{
      console.log(res);
    })

  //   var socket = new WebSocket('ws://203.107.45.154:8002'); 
  //   // 打开Socket 
  //   socket.onopen = function (event) {

  //     // 发送一个初始化消息
  //     socket.send(sendData);

  //     // 监听消息
  //     socket.onmessage = function (event) {
  //       console.log('Client received a message', event);
  //     };

  //     // 监听Socket的关闭
  //     socket.onclose = function (event) {
  //       console.log('Client notified socket has closed', event);
  //     };

  //     // 关闭Socket.... 
  //     //socket.close() 
  //   };
  }
})
