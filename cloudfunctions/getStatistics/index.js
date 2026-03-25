// 云函数：获取数据统计
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

/**
 * 获取数据统计云函数
 * 返回巡检数据、隐患数据、巡检员绩效等统计信息
 *
 * @param {Object} event
 * @param {string} event.startDate - 开始日期（可选，格式：YYYY-MM-DD）
 * @param {string} event.endDate - 结束日期（可选，格式：YYYY-MM-DD）
 * @param {string} event.campus - 校区筛选（可选）
 * @returns {Object} 统计数据
 */
exports.main = async (event, context) => {
  const { startDate, endDate, campus } = event

  try {
    console.log('开始统计，参数:', { startDate, endDate, campus })

    // 构建日期筛选条件
    let dateFilter = {}
    if (startDate || endDate) {
      const conditions = []
      if (startDate) {
        const startDateTime = new Date(`${startDate}T00:00:00`)
        conditions.push(_.gte(startDateTime))
      }
      if (endDate) {
        const endDateTime = new Date(`${endDate}T23:59:59`)
        conditions.push(_.lte(endDateTime))
      }
      dateFilter = {
        createdAt: conditions.length === 1 ? conditions[0] : _.and(...conditions)
      }
    }

    // 构建校区筛选条件
    let campusFilter = campus ? { campus: campus } : {}

    // 合并所有筛选条件
    const combinedFilter = {
      ...dateFilter,
      ...campusFilter
    }

    // ========== 1. 总体统计 ==========
    const totalInspections = (await db.collection('inspections')
      .where(combinedFilter)
      .count()).total

    const normalCount = (await db.collection('inspections')
      .where({ ...combinedFilter, result: '正常' })
      .count()).total

    const abnormalCount = totalInspections - normalCount

    const inspectorsCount = (await db.collection('inspections')
      .where(combinedFilter)
      .aggregate()
      .group({
        _id: '$inspectorId'
      })
      .end()).list.length

    // ========== 2. 校区对比 ==========
    const wangjingCount = (await db.collection('inspections')
      .where({ ...dateFilter, campus: '望京校区' })
      .count()).total

    const helingliCount = (await db.collection('inspections')
      .where({ ...dateFilter, campus: '和平里校区' })
      .count()).total

    // ========== 3. 隐患统计 ==========
    const hazards = await db.collection('hazards').get()
    const hazardStats = {}
    const hazardSeverityStats = { high: 0, medium: 0, low: 0 }

    hazards.data.forEach(h => {
      // 按类型统计
      hazardStats[h.type] = (hazardStats[h.type] || 0) + 1
      // 按严重程度统计
      hazardSeverityStats[h.severity] = (hazardSeverityStats[h.severity] || 0) + 1
    })

    // ========== 4. 巡检员绩效排行（Top 6）==========
    const inspectorStats = await db.collection('inspections')
      .aggregate()
      .match(combinedFilter)
      .group({
        _id: '$inspectorId',
        name: $.first('$inspectorName'),
        campus: $.first('$campus'),
        total: $.sum(1),
        normal: $.sum($.cond([$.eq('$result', '正常'), 1, 0])),
        abnormal: $.sum($.cond([$.eq('$result', '异常'), 1, 0])),
        verified: $.sum($.cond([$.eq('$verified', true), 1, 0]))
      })
      .sort({ total: -1 })
      .limit(6)
      .end()

    // ========== 5. 最近7天趋势 ==========
    const today = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 7)

    const dailyStats = await db.collection('inspections')
      .aggregate()
      .match({
        createdAt: _.gte(sevenDaysAgo)
      })
      .group({
        _id: {
          date: $.dateToString({
            date: '$createdAt',
            format: '%Y-%m-%d',
            timezone: 'Asia/Shanghai'
          })
        },
        total: $.sum(1),
        normal: $.sum($.cond([$.eq('$result', '正常'), 1, 0])),
        abnormal: $.sum($.cond([$.eq('$result', '异常'), 1, 0]))
      })
      .sort({ '_id.date': 1 })
      .end()

    // 填充缺失的日期数据
    const trendData = fillMissingDates(dailyStats.list, sevenDaysAgo, today)

    // ========== 6. 地点巡检统计 ==========
    const locationStats = await db.collection('locations')
      .orderBy('inspectionCount', 'desc')
      .limit(12)
      .get()

    // ========== 7. 隐患状态统计 ==========
    const hazardStatusStats = {
      pending: (await db.collection('hazards').where({ status: 'pending' }).count()).total,
      in_progress: (await db.collection('hazards').where({ status: 'in_progress' }).count()).total,
      resolved: (await db.collection('hazards').where({ status: 'resolved' }).count()).total
    }

    // ========== 返回结果 ==========
    return {
      success: true,
      data: {
        // 总体
        overall: {
          total: totalInspections,
          normal: normalCount,
          abnormal: abnormalCount,
          inspectors: inspectorsCount,
          abnormalRate: totalInspections > 0 ? (abnormalCount / totalInspections * 100).toFixed(1) : 0
        },

        // 校区对比
        campus: {
          wangjing: wangjingCount,
          helingli: helingliCount
        },

        // 隐患统计
        hazards: {
          byType: hazardStats,
          bySeverity: hazardSeverityStats,
          byStatus: hazardStatusStats,
          total: hazards.data.length
        },

        // 巡检员绩效
        inspectors: inspectorStats.list.map(item => ({
          name: item.name,
          campus: item.campus,
          total: item.total,
          normal: item.normal,
          abnormal: item.abnormal,
          verified: item.verified,
          abnormalRate: item.total > 0 ? (item.abnormal / item.total * 100).toFixed(1) : 0
        })),

        // 趋势数据
        trend: trendData,

        // 地点统计
        locations: locationStats.data.map(loc => ({
          name: loc.name,
          campus: loc.campus,
          count: loc.inspectionCount || 0,
          lastInspection: loc.lastInspectionAt
        })),

        // 生成时间
        generatedAt: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('统计失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 填充缺失的日期数据
 * @param {Array} data - 原始数据
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Array} 填充后的数据
 */
function fillMissingDates(data, startDate, endDate) {
  const result = []
  const dataMap = {}

  // 将现有数据转为map
  data.forEach(item => {
    dataMap[item._id.date] = item
  })

  // 遍历日期范围
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = formatDate(current)
    const existing = dataMap[dateStr]

    result.push({
      date: dateStr,
      total: existing ? existing.total : 0,
      normal: existing ? existing.normal : 0,
      abnormal: existing ? existing.abnormal : 0
    })

    // 下一天
    current.setDate(current.getDate() + 1)
  }

  return result
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
