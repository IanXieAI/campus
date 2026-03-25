// pages/login/login.js
const app = getApp()

Page({
  data: {
    // 当前模式：wechat（微信登录）或 phone（手机号登录）
    loginMode: 'wechat',

    // 微信登录相关
    userInfo: null,
    loading: false,

    // 手机号登录相关
    phone: '',
    code: '',
    codeButtonText: '获取验证码',
    codeDisabled: false,
    countdown: 0,

    // 错误提示
    errorMessage: ''
  },

  /**
   * 切换登录模式
   */
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      loginMode: mode,
      errorMessage: ''
    })
  },

  /**
   * 微信一键登录
   */
  handleWechatLogin() {
    this.setData({ loading: true, errorMessage: '' })

    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('获取用户信息成功:', res.userInfo)

        // 调用登录云函数
        wx.cloud.callFunction({
          name: 'login',
          data: {
            name: res.userInfo.nickName
          },
          success: (loginRes) => {
            console.log('登录成功:', loginRes)

            if (loginRes.result.success) {
              // 保存用户信息
              app.globalData.userInfo = loginRes.result.user
              app.globalData.openid = loginRes.result.userId

              // 存储到本地
              wx.setStorageSync('userInfo', loginRes.result.user)
              wx.setStorageSync('openid', loginRes.result.userId)

              // 根据角色跳转
              this.navigateByRole(loginRes.result.user.role)
            } else {
              this.setData({
                loading: false,
                errorMessage: '登录失败，请重试'
              })
            }
          },
          fail: (err) => {
            console.error('登录云函数调用失败:', err)
            this.setData({
              loading: false,
              errorMessage: '登录失败，请检查网络连接'
            })
          }
        })
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        this.setData({
          loading: false,
          errorMessage: '需要授权才能使用小程序'
        })
      }
    })
  },

  /**
   * 手机号输入
   */
  handlePhoneInput(e) {
    this.setData({ phone: e.detail.value, errorMessage: '' })
  },

  /**
   * 验证码输入
   */
  handleCodeInput(e) {
    this.setData({ code: e.detail.value, errorMessage: '' })
  },

  /**
   * 获取验证码
   */
  handleGetCode() {
    // 验证手机号
    if (!this.validatePhone(this.data.phone)) {
      this.setData({ errorMessage: '请输入正确的手机号' })
      return
    }

    // 开始倒计时
    this.setData({
      codeDisabled: true,
      countdown: 60,
      codeButtonText: '60s后重新获取'
    })

    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({
          codeDisabled: false,
          countdown: 0,
          codeButtonText: '获取验证码'
        })
      } else {
        this.setData({
          countdown,
          codeButtonText: `${countdown}s后重新获取`
        })
      }
    }, 1000)

    // TODO: 调用短信验证码API
    wx.showToast({
      title: '验证码已发送',
      icon: 'success'
    })

    console.log('发送验证码到:', this.data.phone)
  },

  /**
   * 手机号登录
   */
  handlePhoneLogin() {
    // 验证手机号
    if (!this.validatePhone(this.data.phone)) {
      this.setData({ errorMessage: '请输入正确的手机号' })
      return
    }

    // 验证验证码
    if (!this.data.code || this.data.code.length !== 6) {
      this.setData({ errorMessage: '请输入6位验证码' })
      return
    }

    this.setData({ loading: true, errorMessage: '' })

    // 模拟手机号登录
    // TODO: 实现真实的手机号验证码验证逻辑
    setTimeout(() => {
      // 查询数据库中是否存在该手机号的用户
      wx.cloud.database().collection('users').where({
        phone: this.data.phone
      }).get().then(res => {
        if (res.data.length > 0) {
          const user = res.data[0]
          app.globalData.userInfo = user
          wx.setStorageSync('userInfo', user)
          this.navigateByRole(user.role)
        } else {
          this.setData({
            loading: false,
            errorMessage: '该手机号未注册，请联系管理员'
          })
        }
      }).catch(err => {
        console.error('查询用户失败:', err)
        this.setData({
          loading: false,
          errorMessage: '登录失败，请重试'
        })
      })
    }, 1000)
  },

  /**
   * 验证手机号格式
   */
  validatePhone(phone) {
    const reg = /^1[3-9]\d{9}$/
    return reg.test(phone)
  },

  /**
   * 根据角色跳转到对应页面
   */
  navigateByRole(role) {
    this.setData({ loading: false })

    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    })

    setTimeout(() => {
      if (role === 'admin') {
        wx.reLaunch({
          url: '/pages/admin/home/home'
        })
      } else if (role === 'viewer') {
        wx.reLaunch({
          url: '/pages/viewer/home/home'
        })
      } else {
        // inspector
        wx.reLaunch({
          url: '/pages/inspector/home/home'
        })
      }
    }, 1500)
  }
})
