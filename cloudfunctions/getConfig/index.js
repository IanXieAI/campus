// 云函数：获取系统配置
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取系统配置云函数
 *
 * @param {Object} event
 * @returns {Object} 系统配置信息
 */
exports.main = async (event, context) => {
  try {
    console.log('获取系统配置')

    // 获取配置文档
    const result = await db.collection('config').doc('settings').get()

    if (result.data) {
      return {
        success: true,
        data: result.data
      }
    }

    // 如果配置不存在，返回默认配置
    const defaultConfig = {
      _id: 'settings',
      features: {
        locationVerification: true,
        editPermission: false,
        aiProcessing: true,
        voiceInput: true,
        notification: true,
        reportExport: true
      },
      appVersion: '1.0.0',
      updatedAt: new Date()
    }

    // 创建默认配置
    await db.collection('config').add({
      data: defaultConfig
    })

    return {
      success: true,
      data: defaultConfig
    }

  } catch (error) {
    console.error('获取系统配置失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * TODO: 添加更新配置功能（仅管理员）
 */
async function updateConfig(config) {
  // 权限验证
  // 更新配置
  // 返回结果
}
