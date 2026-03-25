// 云函数：获取巡检地点列表
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取巡检地点列表云函数
 *
 * @param {Object} event
 * @param {string} event.campus - 校区筛选（可选）
 * @param {boolean} event.onlyActive - 只返回启用的地点（默认true）
 * @returns {Object} 地点列表
 */
exports.main = async (event, context) => {
  const { campus, onlyActive = true } = event

  try {
    console.log('查询地点列表，参数:', { campus, onlyActive })

    // 构建查询条件
    let queryConditions = {}

    if (campus) {
      queryConditions.campus = campus
    }

    if (onlyActive) {
      queryConditions.isActive = true
    }

    // 获取地点列表（按优先级和名称排序）
    const result = await db.collection('locations')
      .where(queryConditions)
      .orderBy('priority', 'desc')
      .orderBy('name', 'asc')
      .get()

    // 格式化返回数据
    const locations = result.data.map(loc => ({
      id: loc._id,
      name: loc.name,
      campus: loc.campus,
      latitude: loc.latitude,
      longitude: loc.longitude,
      priority: loc.priority,
      isActive: loc.isActive,
      inspectionCount: loc.inspectionCount || 0,
      lastInspection: loc.lastInspectionAt ? formatDateTime(loc.lastInspectionAt) : null
    }))

    // 统计各校区数量
    const campusCounts = {
      wangjing: locations.filter(l => l.campus === '望京校区').length,
      helingli: locations.filter(l => l.campus === '和平里校区').length
    }

    return {
      success: true,
      data: {
        locations,
        campusCounts,
        total: locations.length
      }
    }

  } catch (error) {
    console.error('查询地点列表失败:', error)
    return {
      success: false,
      error: error.message,
      data: {
        locations: [],
        campusCounts: { wangjing: 0, helingli: 0 },
        total: 0
      }
    }
  }
}

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期对象或ISO字符串
 * @returns {string} 格式化的日期时间字符串
 */
function formatDateTime(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}
