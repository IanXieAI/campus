// 云函数：获取巡检记录列表
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取巡检记录列表云函数
 *
 * @param {Object} event
 * @param {string} event.userId - 用户ID
 * @param {string} event.role - 用户角色（inspector/admin/viewer）
 * @param {string} event.campus - 校区筛选（可选）
 * @param {string} event.result - 结果筛选（normal/abnormal，可选）
 * @param {number} event.page - 页码（从1开始，默认1）
 * @param {number} event.pageSize - 每页数量（默认20，最大50）
 * @returns {Object} 记录列表和分页信息
 */
exports.main = async (event, context) => {
  const { userId, role, campus, result, page = 1, pageSize = 20 } = event

  try {
    console.log('查询巡检记录，参数:', { userId, role, campus, result, page, pageSize })

    // 限制每页最大数量
    const actualPageSize = Math.min(pageSize, 50)
    const skip = (page - 1) * actualPageSize

    // 构建查询条件
    let queryConditions = {}

    // 根据角色筛选
    if (role === 'inspector') {
      // 巡检员只能看到自己的记录
      queryConditions.inspectorId = userId
    } else if (role === 'admin' || role === 'viewer') {
      // 管理员和报表查看者可以看到所有记录
      // 如果指定了校区，筛选校区
      if (campus) {
        queryConditions.campus = campus
      }
      // 如果指定了结果，筛选结果
      if (result) {
        queryConditions.result = result === 'normal' ? '正常' : '异常'
      }
    }

    // 获取总数
    const countResult = await db.collection('inspections')
      .where(queryConditions)
      .count()

    const total = countResult.total

    // 获取记录列表（按时间倒序）
    const recordsResult = await db.collection('inspections')
      .where(queryConditions)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(actualPageSize)
      .get()

    // 格式化返回数据
    const records = recordsResult.data.map(record => ({
      id: record._id,
      date: formatDateTime(record.createdAt),
      campus: record.campus,
      location: record.location,
      inspector: record.inspectorName,
      result: record.result,
      issue: record.issue,
      severity: record.severity,
      verified: record.verified,
      images: record.images || [],
      hasAudio: !!record.audio,
      status: record.status,
      aiConfidence: record.aiAnalysis?.confidence || 0
    }))

    return {
      success: true,
      data: {
        records,
        pagination: {
          page: page,
          pageSize: actualPageSize,
          total: total,
          totalPages: Math.ceil(total / actualPageSize),
          hasNext: page < Math.ceil(total / actualPageSize),
          hasPrev: page > 1
        }
      }
    }

  } catch (error) {
    console.error('查询巡检记录失败:', error)
    return {
      success: false,
      error: error.message,
      data: {
        records: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
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
