// pages/inspector/input/input.js
const app = getApp()

const MAX_PHOTO_COUNT = 3
const LOCATION_DISTANCE_LIMIT = 100

Page({
  data: {
    userInfo: null,
    aiInput: '',
    wordCount: 0,
    isRecording: false,
    aiResult: null,
    analyzing: false,

    currentLatitude: null,
    currentLongitude: null,
    locationVerified: false,
    locationName: '',
    locationCheckStatus: 'idle',
    locationWarningMessage: '',
    locationDistance: null,

    photos: []
  },

  onLoad() {
    this.setData({ userInfo: app.globalData.userInfo || {} })
    this.getLocation()
  },

  getLocation() {
    this.setData({
      locationCheckStatus: 'locating',
      locationWarningMessage: ''
    })

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          currentLatitude: res.latitude,
          currentLongitude: res.longitude,
          locationCheckStatus: this.data.aiResult ? 'checking' : 'idle'
        })

        if (this.data.aiResult && this.data.aiResult.location && this.data.aiResult.location !== '未知地点') {
          this.verifyLocation(this.data.aiResult.location)
        }
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        this.setData({
          locationCheckStatus: 'unavailable',
          locationWarningMessage: '无法获取当前位置，将保留定位警告，但你仍可继续提交。'
        })
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
      }
    })
  },

  handleInput(e) {
    const text = e.detail.value
    this.setData({
      aiInput: text,
      wordCount: text.length
    })
  },

  handleVoiceInput() {
    if (this.data.isRecording) {
      this.stopRecording()
      return
    }

    this.startRecording()
  },

  startRecording() {
    const recorderManager = wx.getRecorderManager()

    recorderManager.onStart(() => {
      this.setData({ isRecording: true })
    })

    recorderManager.onStop((res) => {
      console.log('录音结束:', res)
      this.setData({ isRecording: false })
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

    recorderManager.start({
      duration: 60000,
      format: 'mp3'
    })

    this.recorderManager = recorderManager
  },

  stopRecording() {
    if (this.recorderManager) {
      this.recorderManager.stop()
    }
  },

  recognizeVoice(filePath) {
    wx.showLoading({ title: '识别中...' })

    // TODO: 集成微信实时语音识别API
    setTimeout(() => {
      wx.hideLoading()
      const simulatedText = '诚信楼一楼东侧消防通道畅通，灭火器完好，无安全隐患'
      this.setData({
        aiInput: simulatedText,
        wordCount: simulatedText.length
      })

      this.analyzeInput()
    }, 1000)
  },

  analyzeInput() {
    if (!this.data.aiInput.trim()) {
      wx.showToast({
        title: '请输入巡查描述',
        icon: 'none'
      })
      return
    }

    this.setData({
      analyzing: true,
      aiResult: null,
      locationVerified: false,
      locationName: '',
      locationCheckStatus: 'idle',
      locationWarningMessage: '',
      locationDistance: null
    })

    wx.cloud.callFunction({
      name: 'aiAnalysis',
      data: {
        description: this.data.aiInput,
        campus: this.data.userInfo.campus || ''
      },
      success: (res) => {
        console.log('AI分析结果:', res)

        if (!res.result.success) {
          wx.showToast({
            title: '分析失败',
            icon: 'none'
          })
          this.setData({ analyzing: false })
          return
        }

        const aiResult = res.result.data
        const nextData = {
          aiResult,
          analyzing: false
        }

        if (!aiResult.location || aiResult.location === '未知地点') {
          nextData.locationCheckStatus = 'unavailable'
          nextData.locationWarningMessage = '未识别到可校验的位置，将保留警告但不阻塞提交。'
        } else if (this.data.currentLatitude == null || this.data.currentLongitude == null) {
          nextData.locationName = aiResult.location
          nextData.locationCheckStatus = 'unavailable'
          nextData.locationWarningMessage = '当前位置不可用，无法完成位置验证。'
        } else {
          nextData.locationName = aiResult.location
          nextData.locationCheckStatus = 'checking'
        }

        this.setData(nextData)

        if (aiResult.location && aiResult.location !== '未知地点' &&
            this.data.currentLatitude != null && this.data.currentLongitude != null) {
          this.verifyLocation(aiResult.location)
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

  verifyLocation(input) {
    const targetLocation = typeof input === 'string'
      ? input
      : input && input.currentTarget && input.currentTarget.dataset
        ? input.currentTarget.dataset.location
        : this.data.locationName

    if (!targetLocation) {
      return
    }

    if (this.data.currentLatitude == null || this.data.currentLongitude == null) {
      this.setData({
        locationVerified: false,
        locationName: targetLocation,
        locationCheckStatus: 'unavailable',
        locationWarningMessage: '当前位置不可用，无法完成位置验证。',
        locationDistance: null
      })
      return
    }

    this.setData({
      locationName: targetLocation,
      locationCheckStatus: 'checking',
      locationWarningMessage: '',
      locationDistance: null
    })

    wx.cloud.database().collection('locations')
      .where({ name: targetLocation })
      .get()
      .then((res) => {
        if (!res.data.length) {
          this.setData({
            locationVerified: false,
            locationCheckStatus: 'unavailable',
            locationWarningMessage: '未找到该地点的坐标信息，将保留警告但不阻塞提交。',
            locationDistance: null
          })
          return
        }

        const location = res.data[0]
        if (location.latitude == null || location.longitude == null) {
          this.setData({
            locationVerified: false,
            locationCheckStatus: 'unavailable',
            locationWarningMessage: '该地点缺少坐标信息，将保留警告但不阻塞提交。',
            locationDistance: null
          })
          return
        }

        const distance = Math.round(this.calculateDistance(
          this.data.currentLatitude,
          this.data.currentLongitude,
          location.latitude,
          location.longitude
        ))
        const locationVerified = distance < LOCATION_DISTANCE_LIMIT

        this.setData({
          locationVerified,
          locationCheckStatus: locationVerified ? 'passed' : 'warning',
          locationWarningMessage: locationVerified
            ? '位置验证通过。'
            : `当前位置与“${targetLocation}”相距约 ${distance} 米。可继续提交，但会保留告警记录。`,
          locationDistance: distance
        })
      })
      .catch((err) => {
        console.error('获取地点信息失败:', err)
        this.setData({
          locationVerified: false,
          locationCheckStatus: 'unavailable',
          locationWarningMessage: '位置验证失败，将保留警告但不阻塞提交。',
          locationDistance: null
        })
      })
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371e3
    const phi1 = lat1 * Math.PI / 180
    const phi2 = lat2 * Math.PI / 180
    const deltaPhi = (lat2 - lat1) * Math.PI / 180
    const deltaLambda = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadius * c
  },

  choosePhotos() {
    const remainingCount = MAX_PHOTO_COUNT - this.data.photos.length

    if (remainingCount <= 0) {
      wx.showToast({
        title: `最多上传${MAX_PHOTO_COUNT}张照片`,
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const newPhotos = res.tempFilePaths.map((tempFilePath, index) => ({
          id: `${Date.now()}-${index}`,
          tempFilePath,
          fileID: '',
          uploading: true,
          uploaded: false,
          error: ''
        }))

        this.setData({
          photos: this.data.photos.concat(newPhotos)
        })

        newPhotos.forEach((photo) => {
          this.uploadPhoto(photo.id, photo.tempFilePath)
        })
      }
    })
  },

  uploadPhoto(photoId, filePath) {
    const fileExtension = filePath.split('.').pop() || 'jpg'
    const cloudPath = `inspections/${app.globalData.openid || 'anonymous'}/${Date.now()}-${photoId}.${fileExtension}`

    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        this.updatePhoto(photoId, {
          fileID: res.fileID,
          uploading: false,
          uploaded: true,
          error: ''
        })
      },
      fail: (err) => {
        console.error('上传照片失败:', err)
        this.updatePhoto(photoId, {
          uploading: false,
          uploaded: false,
          error: '上传失败，请重试或删除。'
        })
        wx.showToast({
          title: '照片上传失败',
          icon: 'none'
        })
      }
    })
  },

  updatePhoto(photoId, patch) {
    const photos = this.data.photos.map((photo) => {
      if (photo.id === photoId) {
        return Object.assign({}, photo, patch)
      }
      return photo
    })

    this.setData({ photos })
  },

  previewPhoto(e) {
    const current = e.currentTarget.dataset.url
    const urls = this.data.photos
      .map((photo) => photo.tempFilePath || photo.fileID)
      .filter(Boolean)

    if (!current || !urls.length) {
      return
    }

    wx.previewImage({
      current,
      urls
    })
  },

  removePhoto(e) {
    const photoId = e.currentTarget.dataset.id
    this.setData({
      photos: this.data.photos.filter((photo) => photo.id !== photoId)
    })
  },

  retryUploadPhoto(e) {
    const photoId = e.currentTarget.dataset.id
    const photo = this.data.photos.find((item) => item.id === photoId)
    if (!photo) {
      return
    }

    this.updatePhoto(photoId, {
      uploading: true,
      uploaded: false,
      error: ''
    })
    this.uploadPhoto(photoId, photo.tempFilePath)
  },

  confirmInspection() {
    if (!this.data.aiResult) {
      wx.showToast({
        title: '请先进行分析',
        icon: 'none'
      })
      return
    }

    if (this.data.photos.some((photo) => photo.uploading)) {
      wx.showToast({
        title: '请等待照片上传完成',
        icon: 'none'
      })
      return
    }

    if (this.data.photos.some((photo) => photo.error || !photo.uploaded)) {
      wx.showToast({
        title: '请重试或删除上传失败的照片',
        icon: 'none'
      })
      return
    }

    const shouldWarn = this.data.locationCheckStatus === 'warning' || this.data.locationCheckStatus === 'unavailable'
    if (shouldWarn) {
      wx.showModal({
        title: '位置验证未通过',
        content: this.data.locationWarningMessage || '位置验证未通过，但仍可继续提交。',
        confirmText: '继续提交',
        cancelText: '返回检查',
        success: (res) => {
          if (res.confirm) {
            this.submitInspection(true)
          }
        }
      })
      return
    }

    this.submitInspection(false)
  },

  submitInspection(userConfirmedLocationWarning) {
    wx.showLoading({ title: '提交中...' })

    wx.cloud.callFunction({
      name: 'submitInspection',
      data: {
        inspectorId: app.globalData.openid,
        inspectorName: this.data.userInfo.name || '',
        campus: this.data.aiResult.campus,
        location: this.data.aiResult.location,
        verified: this.data.locationVerified,
        locationCheckStatus: this.data.locationCheckStatus,
        locationWarningMessage: this.data.locationWarningMessage,
        locationDistance: this.data.locationDistance,
        locationWarningTriggered: this.data.locationCheckStatus === 'warning' || this.data.locationCheckStatus === 'unavailable',
        userConfirmedLocationWarning,
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
        images: this.data.photos.map((photo) => photo.fileID).filter(Boolean),
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
          return
        }

        wx.showToast({
          title: res.result.message || '提交失败',
          icon: 'none'
        })
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

  resetInput() {
    this.setData({
      aiInput: '',
      wordCount: 0,
      aiResult: null,
      locationVerified: false,
      locationName: '',
      locationCheckStatus: 'idle',
      locationWarningMessage: '',
      locationDistance: null,
      photos: []
    })
  }
})