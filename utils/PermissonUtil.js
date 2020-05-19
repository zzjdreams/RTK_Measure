
function getSetting(permission) {
  wx.getSetting({
    success: function (res) {
      if (!res.authSetting[permission]) {
        wx.openSetting({
          success: function (res) {
            wx.authorize({
              scope: permission,
              success() {
                console.log('授权成功')
              },
              fail() {
                console.log("授权失败")
              }
            })
          }

        })
      }
    }
  })
}


module.exports = {
  getSetting: getSetting
  
}