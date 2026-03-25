// 云函数：用户管理（仅管理员）
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 用户管理云函数
 * 仅管理员可调用
 *
 * @param {Object} event
 * @param {string} event.action - 操作类型：list/updateRole/delete/getUsersByRole
 * @param {string} event.userId - 用户ID（更新、删除时需要）
 * @param {string} event.role - 角色（更新角色时需要：inspector/admin/viewer）
 * @param {string} event.targetRole - 筛选角色（获取列表时需要）
 * @param {number} event.page - 页码
 * @param {number} event.pageSize - 每页数量
 * @returns {Object} 操作结果
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, userId, role, targetRole, page = 1, pageSize = 20 } = event

  try {
    // 验证操作者是否为管理员
    const operator = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()

    if (operator.data.length === 0 || operator.data[0].role !== 'admin') {
      return {
        success: false,
        error: '权限不足，仅管理员可执行此操作'
      }
    }

    console.log('用户管理操作:', { action, operator: operator.data[0].name })

    // 根据操作类型执行不同逻辑
    switch (action) {
      case 'list':
        return await getUserList(page, pageSize)
      case 'getUsersByRole':
        return await getUsersByRole(targetRole)
      case 'updateRole':
        return await updateUserRole(userId, role)
      case 'updateCampus':
        return await updateUserCampus(userId, event.campus)
      case 'delete':
        return await deleteUser(userId)
      case 'getStats':
        return await getUserStats()
      default:
        return {
          success: false,
          error: '未知的操作类型'
        }
    }

  } catch (error) {
    console.error('用户管理失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取用户列表
 */
async function getUserList(page, pageSize) {
  const actualPageSize = Math.min(pageSize, 50)
  const skip = (page - 1) * actualPageSize

  const countResult = await db.collection('users').count()
  const total = countResult.total

  const result = await db.collection('users')
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(actualPageSize)
    .get()

  const users = result.data.map(user => ({
    id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    roleText: getRoleText(user.role),
    campus: user.campus,
    avatar: user.avatar,
    createdAt: formatDateTime(user.createdAt),
    lastLogin: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : null
  }))

  return {
    success: true,
    data: {
      users,
      pagination: {
        page,
        pageSize: actualPageSize,
        total,
        totalPages: Math.ceil(total / actualPageSize),
        hasNext: page < Math.ceil(total / actualPageSize),
        hasPrev: page > 1
      }
    }
  }
}

/**
 * 根据角色获取用户列表
 */
async function getUsersByRole(role) {
  const result = await db.collection('users')
    .where({ role: role })
    .orderBy('name', 'asc')
    .get()

  const users = result.data.map(user => ({
    id: user._id,
    name: user.name,
    phone: user.phone,
    campus: user.campus
  }))

  return {
    success: true,
    data: {
      users,
      total: users.length
    }
  }
}

/**
 * 更新用户角色
 */
async function updateUserRole(userId, newRole) {
  // 验证新角色是否有效
  const validRoles = ['inspector', 'admin', 'viewer']
  if (!validRoles.includes(newRole)) {
    return {
      success: false,
      error: '无效的角色'
    }
  }

  // 获取目标用户信息
  const targetUser = await db.collection('users').doc(userId).get()

  if (!targetUser.data) {
    return {
      success: false,
      error: '用户不存在'
    }
  }

  // 防止降级超级管理员（手机号 13800138888）
  if (targetUser.data.phone === '13800138888' && newRole !== 'admin') {
    return {
      success: false,
      error: '无法降级超级管理员'
    }
  }

  // 更新角色
  await db.collection('users').doc(userId).update({
    data: {
      role: newRole,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: `用户 ${targetUser.data.name} 已更新为 ${getRoleText(newRole)}`
  }
}

/**
 * 更新用户校区
 */
async function updateUserCampus(userId, campus) {
  const validCampuses = ['望京校区', '和平里校区']
  if (!validCampuses.includes(campus)) {
    return {
      success: false,
      error: '无效的校区'
    }
  }

  const targetUser = await db.collection('users').doc(userId).get()
  if (!targetUser.data) {
    return {
      success: false,
      error: '用户不存在'
    }
  }

  await db.collection('users').doc(userId).update({
    data: {
      campus: campus,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: `用户 ${targetUser.data.name} 已分配至 ${campus}`
  }
}

/**
 * 删除用户
 */
async function deleteUser(userId) {
  // 获取目标用户信息
  const targetUser = await db.collection('users').doc(userId).get()

  if (!targetUser.data) {
    return {
      success: false,
      error: '用户不存在'
    }
  }

  // 防止删除超级管理员
  if (targetUser.data.phone === '13800138888') {
    return {
      success: false,
      error: '无法删除超级管理员'
    }
  }

  // 删除用户
  await db.collection('users').doc(userId).remove()

  return {
    success: true,
    message: `用户 ${targetUser.data.name} 已删除`
  }
}

/**
 * 获取用户统计
 */
async function getUserStats() {
  const total = (await db.collection('users').count()).total
  const admin = (await db.collection('users').where({ role: 'admin' }).count()).total
  const inspector = (await db.collection('users').where({ role: 'inspector' }).count()).total
  const viewer = (await db.collection('users').where({ role: 'viewer' }).count()).total

  const wangjing = (await db.collection('users').where({ campus: '望京校区' }).count()).total
  const helingli = (await db.collection('users').where({ campus: '和平里校区' }).count()).total

  return {
    success: true,
    data: {
      total,
      byRole: {
        admin,
        inspector,
        viewer
      },
      byCampus: {
        wangjing,
        helingli
      }
    }
  }
}

/**
 * 获取角色文本
 */
function getRoleText(role) {
  const roleMap = {
    'admin': '管理员',
    'inspector': '巡检员',
    'viewer': '报表查看'
  }
  return roleMap[role] || role
}

/**
 * 格式化日期时间
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
