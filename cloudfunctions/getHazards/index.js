// 云函数：获取隐患列表
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取隐患列表云函数
 *
 * @param {Object} event
 * @param {string} event.campus - 校区筛选（可选）
 * @param {string} event.status - 状态筛选（pending/in_progress/resolved，可选）
 * @param {string} event.severity - 严重程度筛选（low/medium/high/critical，可选）
 * @param {string} event.type - 类型筛选（可选）
 * @param {number} event.page - 页码（从1开始，默认1）
 * @param {number} event.pageSize - 每页数量（默认20，最大50）
 * @returns {Object} 隐患列表和分页信息
 */
exports.main = async (event, context) => {
  const { campus, status, severity, type, page = 1, pageSize = 20 } = event

  try {
    console.log('查询隐患列表，参数:', { campus, status, severity, type, page, pageSize })

    // 限制每页最大数量
    const actualPageSize = Math.min(pageSize, 50)
    const skip = (page - 1) * actualPageSize

    // 构建查询条件
    let queryConditions = {}

    if (campus) {
      queryConditions.campus = campus
    }

    if (status) {
      const statusMap = {
        'pending': 'pending',
        'in_progress': 'in_progress',
        'resolved': 'resolved'
      }
      queryConditions.status = statusMap[status] || status
    }

    if (severity) {
      queryConditions.severity = severity
    }

    if (type) {
      queryConditions.type = type
    }

    // 获取总数
    const countResult = await db.collection('hazards')
      .where(queryConditions)
      .count()

    const total = countResult.total

    // 获取隐患列表（按创建时间倒序，未解决的优先）
    const hazardsResult = await db.collection('hazards')
      .where(queryConditions)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(actualPageSize)
      .get()

    // 格式化返回数据
    const hazards = await Promise.all(hazardsResult.data.map(async hazard => {
      // 获取关联的巡检记录
      let inspectionInfo = null
      if (hazard.inspectionId) {
        try {
          const inspection = await db.collection('inspections')
            .doc(hazard.inspectionId)
            .get()

          inspectionInfo = {
            inspector: inspection.data.inspectorName,
            date: formatDateTime(inspection.data.createdAt)
          }
        } catch (e) {
          console.error('获取巡检记录失败:', e)
        }
      }

      return {
        id: hazard._id,
        title: hazard.title,
        type: hazard.type,
        severity: hazard.severity,
        location: hazard.location,
        description: hazard.description,
        status: hazard.status,
        statusText: getStatusText(hazard.status),
        assignedTo: hazard.assignedTo,
        inspection: inspectionInfo,
        createdAt: formatDateTime(hazard.createdAt),
        resolvedAt: hazard.resolvedAt ? formatDateTime(hazard.resolvedAt) : null
      }
    }))

    // 统计各状态数量
    const statusCounts = {
      pending: (await db.collection('hazards').where({ status: 'pending' }).count()).total,
      in_progress: (await db.collection('hazards').where({ status: 'in_progress' }).count()).total,
      resolved: (await db.collection('hazards').where({ status: 'resolved' }).count()).total
    }

    return {
      success: true,
      data: {
        hazards,
        pagination: {
          page: page,
          pageSize: actualPageSize,
          total: total,
          totalPages: Math.ceil(total / actualPageSize),
          hasNext: page < Math.ceil(total / actualPageSize),
          hasPrev: page > 1
        },
        statusCounts
      }
    }

  } catch (error) {
    console.error('查询隐患列表失败:', error)
    return {
      success: false,
      error: error.message,
      data: {
        hazards: [],
        pagination: {
          page,
          pageSize: actualPageSize,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        statusCounts: { pending: 0, in_progress: 0, resolved: 0 }
      }
    }
  }
}

/**
 * 获取状态文本
 * @param {string} status - 状态代码
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  const statusMap = {
    'pending': '待处理',
    'in_progress': '处理中',
    'resolved': '已解决'
  }
  return statusMap[status] || status
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
