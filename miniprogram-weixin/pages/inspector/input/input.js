// pages/inspector/input/input.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    aiInput: '',
    wordCount: 0,
    isRecording: false,
    aiResult: null,
    analyzing: false,

    // 位置信息
    currentLatitude: null,
    currentLongitude: null,
    locationVerified: false,
    locationName: ''
  },

  onLoad() {
    this.setData({ userInfo: app.globalData.userInfo })

    // 获取当前位置
    this.getLocation()
  },

  /**
   * 获取当前位置
   */
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          currentLatitude: res.latitude,
          currentLongitude: res.longitude
        })
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 文字输入
   */
  handleInput(e) {
    const text = e.detail.value
    this.setData({
      aiInput: text,
      wordCount: text.length
    })
  },

  /**
   * 开始/停止录音
   */
  handleVoiceInput() {
    if (this.data.isRecording) {
      // 停止录音
      this.stopRecording()
    } else {
      // 开始录音
      this.startRecording()
    }
  },

  /**
   * 开始录音
   */
  startRecording() {
    const recorderManager = wx.getRecorderManager()

    recorderManager.onStart(() => {
      this.setData({ isRecording: true })
    })

    recorderManager.onStop((res) => {
      console.log('录音结束:', res)
      this.setData({ isRecording: false })

      // 调用语音识别
      this.recognizeVoice(res.tempFilePath)
    })

    recorderManager.onError((err) => {
      console.error('录音失败:', err)
      this.setData({ isRecording: false })
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      })
    })

    // 开始录音
    recorderManager.start({
      duration: 60000, // 最长60秒
      format: 'mp3'
    })

    this.recorderManager = recorderManager
  },

  /**
   * 停止录音
   */
  stopRecording() {
    if (this.recorderManager) {
      this.recorderManager.stop()
    }
  },

  /**
   * 语音识别（使用微信实时语音识别）
   */
  recognizeVoice(filePath) {
    wx.showLoading({ title: '识别中...' })

    // TODO: 集成微信实时语音识别API
    // 暂时模拟识别结果
    setTimeout(() => {
      wx.hideLoading()
      const simulatedText = '诚信楼一楼东侧消防通道畅通，灭火器完好，无安全隐患'
      this.setData({
        aiInput: simulatedText,
        wordCount: simulatedText.length
      })

      // 自动触发AI分析
      this.analyzeInput()
    }, 1000)
  },

  /**
   * AI分析
   */
  analyzeInput() {
    if (!this.data.aiInput.trim()) {
      wx.showToast({
        title: '请输入巡查描述',
        icon: 'none'
      })
      return
    }

    this.setData({ analyzing: true })

    wx.cloud.callFunction({
      name: 'aiAnalysis',
      data: {
        description: this.data.aiInput,
        campus: this.data.userInfo.campus
      },
      success: (res) => {
        console.log('AI分析结果:', res)

        if (res.result.success) {
          this.setData({
            aiResult: res.result.data,
            analyzing: false
          })

          // 验证位置
          if (res.result.data.location && res.result.data.location !== '未知地点') {
            this.verifyLocation(res.result.data.location)
          }
        } else {
          wx.showToast({
            title: '分析失败',
            icon: 'none'
          })
          this.setData({ analyzing: false })
        }
      },
      fail: (err) => {
        console.error('AI分析失败:', err)
        wx.showToast({
          title: '分析失败，请重试',
          icon: 'none'
        })
        this.setData({ analyzing: false })
      }
    })
  },

  /**
   * 验证位置
   */
  verifyLocation(targetLocation) {
    // 获取目标地点的GPS坐标
    wx.cloud.database().collection('locations')
      .where({ name: targetLocation })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const location = res.data[0]
          if (location.latitude && location.longitude) {
            const distance = this.calculateDistance(
              this.data.currentLatitude,
              this.data.currentLongitude,
              location.latitude,
              location.longitude
            )

            // 如果距离小于100米，认为验证成功
            this.setData({
              locationVerified: distance < 100,
              locationName: targetLocation
            })
          }
        }
      })
      .catch(err => {
        console.error('获取地点信息失败:', err)
      })
  },

  /**
   * 计算两个坐标之间的距离（米）
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  },

  /**
   * 确认上报
   */
  confirmInspection() {
    if (!this.data.aiResult) {
      wx.showToast({
        title: '请先进行分析',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '提交中...' })

    wx.cloud.callFunction({
      name: 'submitInspection',
      data: {
        inspectorId: app.globalData.openid,
        inspectorName: this.data.userInfo.name,
        campus: this.data.aiResult.campus,
        location: this.data.aiResult.location,
        verified: this.data.locationVerified,
        gpsLatitude: this.data.currentLatitude,
        gpsLongitude: this.data.currentLongitude,
        result: this.data.aiResult.result,
        issue: this.data.aiResult.issue,
        severity: this.data.aiResult.severity,
        description: this.data.aiInput,
        aiAnalysis: {
          confidence: this.data.aiResult.confidence,
          keywords: this.data.aiResult.keywords
        },
        images: [],
        audio: null
      },
      success: (res) => {
        console.log('提交成功:', res)

        wx.hideLoading()

        if (res.result.success) {
          wx.showToast({
            title: '上报成功',
            icon: 'success',
            duration: 1500
          })

          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.result.message || '提交失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('提交失败:', err)
        wx.hideLoading()
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 重新录入
   */
  resetInput() {
    this.setData({
      aiInput: '',
      wordCount: 0,
      aiResult: null,
      locationVerified: false
    })
  }
})
