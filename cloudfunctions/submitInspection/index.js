// 云函数：提交巡检记录
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

/**
 * 提交巡检记录云函数
 * @param {Object} event
 * @param {string} event.inspectorId - 巡检员ID
 * @param {string} event.inspectorName - 巡检员姓名
 * @param {string} event.campus - 校区
 * @param {string} event.location - 地点
 * @param {boolean} event.verified - 是否通过位置验证
 * @param {number} event.gpsLatitude - GPS纬度
 * @param {number} event.gpsLongitude - GPS经度
 * @param {string} event.result - 结果（正常/异常）
 * @param {string} event.issue - 问题描述
 * @param {string} event.severity - 严重程度
 * @param {string} event.description - 巡查描述
 * @param {Object} event.aiAnalysis - AI分析结果
 * @param {Array} event.images - 图片URL数组
 * @param {string} event.audio - 语音文件URL
 * @returns {Object} 提交结果
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 构建巡检记录数据
    const inspectionData = {
      inspectorId: event.inspectorId,
      inspectorName: event.inspectorName,
      campus: event.campus,
      location: event.location,
      verified: event.verified || false,
      gpsLatitude: event.gpsLatitude || null,
      gpsLongitude: event.gpsLongitude || null,
      result: event.result || '正常',
      issue: event.issue || '',
      severity: event.severity || 'low',
      description: event.description || '',
      aiAnalysis: event.aiAnalysis || {},
      images: event.images || [],
      audio: event.audio || null,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 创建巡检记录
    const inspectionResult = await db.collection('inspections').add({
      data: inspectionData
    })

    console.log('巡检记录创建成功:', inspectionResult._id)

    // 如果是异常，自动创建隐患记录
    if (event.result === '异常' && event.issue && event.issue !== '设备设施运行正常') {
      const hazardData = {
        inspectionId: inspectionResult._id,
        title: `${event.location} - ${event.issue}`,
        type: inferHazardType(event.issue),
        severity: event.severity || 'medium',
        location: event.location,
        description: event.description || event.issue,
        status: 'pending',
        assignedTo: null,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('hazards').add({
        data: hazardData
      })

      console.log('隐患记录创建成功')
    }

    // 更新地点巡检计数
    await db.collection('locations').where({
      name: event.location
    }).update({
      data: {
        inspectionCount: _.inc(1),
        lastInspectionAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('地点信息更新成功')

    // 发送通知（如果启用通知功能）
    // TODO: 实现消息订阅和推送

    return {
      success: true,
      inspectionId: inspectionResult._id,
      message: '巡检记录提交成功'
    }

  } catch (error) {
    console.error('提交巡检记录失败:', error)
    return {
      success: false,
      error: error.message,
      message: '提交失败，请重试'
    }
  }
}

/**
 * 根据问题描述推断隐患类型
 * @param {string} issue - 问题描述
 * @returns {string} 隐患类型
 */
function inferHazardType(issue) {
  if (!issue) return '其他'

  const typeRules = [
    { keywords: ['消防', '灭火器', '消防栓', '通道', '安全出口'], type: '消防安全' },
    { keywords: ['电线', '电路', '电器', '插座', '开关'], type: '电气安全' },
    { keywords: ['损坏', '破损', '断裂', '松动', '脱落'], type: '设施损坏' },
    { keywords: ['照明', '灯光', '灯泡', '灯具'], type: '照明设施' },
    { keywords: ['门', '窗', '玻璃', '锁'], type: '门窗设施' },
    { keywords: ['地面', '墙面', '天花', '漏水', '渗水'], type: '建筑设施' },
    { keywords: ['视频', '监控', '摄像头'], type: '安防设施' }
  ]

  for (const rule of typeRules) {
    for (const keyword of rule.keywords) {
      if (issue.includes(keyword)) {
        return rule.type
      }
    }
  }

  return '其他'
}
