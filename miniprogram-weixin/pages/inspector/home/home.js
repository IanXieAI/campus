// pages/inspector/home/home.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    todayCount: 0,
    pendingHazards: 0,
    lastInspectionTime: null
  },

  onLoad() {
    this.setData({ userInfo: app.globalData.userInfo })
    this.loadDashboard()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadDashboard()
  },

  /**
   * 加载仪表板数据
   */
  loadDashboard() {
    // 获取今日巡检次数
    this.loadTodayInspections()

    // 获取待处理隐患数
    this.loadPendingHazards()

    // 获取最后一次巡检时间
    this.loadLastInspection()
  },

  /**
   * 获取今日巡检次数
   */
  loadTodayInspections() {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    wx.cloud.database().collection('inspections')
      .where({
        inspectorId: app.globalData.openid,
        createdAt: wx.cloud.database().command.gte(startOfDay)
      })
      .count()
      .then(res => {
        this.setData({ todayCount: res.total })
      })
      .catch(err => {
        console.error('获取今日巡检次数失败:', err)
      })
  },

  /**
   * 获取待处理隐患数
   */
  loadPendingHazards() {
    wx.cloud.database().collection('hazards')
      .where({ status: 'pending' })
      .count()
      .then(res => {
        this.setData({ pendingHazards: res.total })
      })
      .catch(err => {
        console.error('获取隐患数失败:', err)
      })
  },

  /**
   * 获取最后一次巡检时间
   */
  loadLastInspection() {
    wx.cloud.database().collection('inspections')
      .where({
        inspectorId: app.globalData.openid
      })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const lastTime = this.formatDateTime(res.data[0].createdAt)
          this.setData({ lastInspectionTime: lastTime })
        }
      })
      .catch(err => {
        console.error('获取最后一次巡检时间失败:', err)
      })
  },

  /**
   * 开始新巡检
   */
  startInspection() {
    wx.navigateTo({
      url: '/pages/inspector/input/input'
    })
  },

  /**
   * 查看巡检记录
   */
  viewRecords() {
    wx.navigateTo({
      url: '/pages/inspector/records/records'
    })
  },

  /**
   * 查看隐患清单
   */
  viewHazards() {
    wx.navigateTo({
      url: '/pages/inspector/hazards/hazards'
    })
  },

  /**
   * 格式化日期时间
   */
  formatDateTime(date) {
    const d = new Date(date)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
})
