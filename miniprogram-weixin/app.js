// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    env: 'your-env-id' // 替换为你的云开发环境ID
  },

  onLaunch() {
    console.log('UIBE CampusSafe 启动')

    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true
      })

      // 获取用户openid
      this.getOpenid()
    }

    // 检查更新
    this.checkUpdate()
  },

  /**
   * 获取用户openid
   */
  getOpenid() {
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then(res => {
      console.log('获取openid成功:', res)
      if (res.result.success) {
        this.globalData.openid = res.result.userId
        if (res.result.user) {
          this.globalData.userInfo = res.result.user
        }
      }
    }).catch(err => {
      console.error('获取openid失败:', err)
    })
  },

  /**
   * 检查小程序更新
   */
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate(function (res) {
        console.log('检查更新结果:', res.hasUpdate)
      })

      updateManager.onUpdateReady(function () {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success(res) {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(function () {
        wx.showModal({
          title: '更新失败',
          content: '新版本下载失败，请检查网络后重试',
          showCancel: false
        })
      })
    }
  },

  /**
   * 全局错误处理
   */
  onError(msg) {
    console.error('小程序错误:', msg)
  }
})
