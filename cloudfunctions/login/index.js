// 云函数：用户登录
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

/**
 * 用户登录/注册云函数
 * @param {Object} event
 * @param {string} event.name - 用户昵称
 * @param {string} event.phone - 手机号（可选）
 * @returns {Object} 登录结果
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 查询用户是否存在
    const userResult = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()

    if (userResult.data.length > 0) {
      // 用户已存在，更新登录时间
      const userId = userResult.data[0]._id
      await db.collection('users').doc(userId).update({
        data: {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        isNew: false,
        userId: userId,
        user: userResult.data[0]
      }
    }

    // 新用户，创建记录
    // 根据手机号判断角色和校区（测试账号）
    const { name, phone } = event
    const roleAndCampus = determineRoleAndCampus(phone)

    const newUserData = {
      openid: wxContext.OPENID,
      unionid: wxContext.UNIONID || null,
      name: name || '巡检员',
      phone: phone || null,
      role: roleAndCampus.role,
      campus: roleAndCampus.campus,
      avatar: '/images/default-avatar.png',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    }

    const result = await db.collection('users').add({
      data: newUserData
    })

    return {
      success: true,
      isNew: true,
      userId: result._id,
      user: { ...newUserData, _id: result._id }
    }

  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 根据手机号确定用户角色和校区（测试账号逻辑）
 * @param {string} phone - 手机号
 * @returns {Object} { role, campus }
 */
function determineRoleAndCampus(phone) {
  // 测试账号配置
  const testAccounts = {
    '13800138888': { role: 'admin', campus: '望京校区' },    // 管理员
    '13800138001': { role: 'inspector', campus: '望京校区' },  // 张保卫
    '13800138002': { role: 'inspector', campus: '和平里校区' }, // 李保安
    '13800138003': { role: 'inspector', campus: '望京校区' },  // 王巡逻
    '13800138004': { role: 'inspector', campus: '和平里校区' }, // 刘安全
    '13800138005': { role: 'inspector', campus: '望京校区' },  // 赵监督
    '13800138006': { role: 'viewer', campus: '望京校区' }      // 孙分析
  }

  return testAccounts[phone] || { role: 'inspector', campus: '望京校区' }
}
