# 对外经贸大学安全巡检系统 - 微信云开发对接方案

## 项目信息
- 小程序ID: wxa01a88124d29e5a8
- 项目名称: UIBE CampusSafe - 对外经济贸易大学安全巡检系统
- 当前状态: Alpine.js单页应用（本地存储）

## 云开发环境配置

### 步骤1: 开通云开发
1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入小程序管理后台 → 开发 → 云开发
3. 点击"开通"按钮
4. 创建云开发环境（建议环境名称：uibe-campus-safe）
5. 选择基础版（免费额度够用）或按需选择付费版本
6. 记录**环境ID**（格式如：cloud1-xxx）

### 步骤2: 初始化云开发环境
```javascript
// app.js
App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'your-env-id', // 替换为你的环境ID
      traceUser: true
    })
  }
})
```

## 数据库设计

### 1. 用户集合 (users)
```javascript
{
  _id: "自动生成",
  openid: "用户微信openid",
  unionid: "用户微信unionid（可选）",
  name: "张保卫",
  phone: "13800138001",
  role: "inspector", // inspector(巡检员) | admin(管理员) | viewer(报表查看)
  campus: "望京校区",
  avatar: "头像URL",
  createdAt: "2026-03-20T10:00:00Z",
  updatedAt: "2026-03-20T10:00:00Z"
}
```

### 2. 巡检记录集合 (inspections)
```javascript
{
  _id: "自动生成",
  inspectorId: "巡检员ID",
  inspectorName: "张保卫",
  campus: "望京校区",
  location: "诚信楼",
  verified: true, // 是否通过位置验证
  gpsLatitude: 39.998888,
  gpsLongitude: 116.417555,
  result: "正常", // 正常 | 异常
  issue: "设备设施运行正常",
  severity: "low", // low | medium | high | critical
  description: "巡查描述内容",
  aiAnalysis: {
    confidence: 0.95,
    keywords: ["消防", "通道"]
  },
  images: [], // 图片URL数组
  audio: "语音文件URL",
  status: "submitted", // submitted | reviewing | resolved
  createdAt: "2026-03-20T14:30:00Z",
  reviewedAt: null
}
```

### 3. 隐患集合 (hazards)
```javascript
{
  _id: "自动生成",
  inspectionId: "巡检记录ID",
  title: "消防通道阻塞",
  type: "消防安全", // 消防安全 | 电气安全 | 设施损坏 | 其他
  severity: "high", // low | medium | high | critical
  location: "诚信楼1层东侧",
  description: "消防通道被临时放置的桌椅阻塞",
  status: "pending", // pending | in_progress | resolved
  assignedTo: "维修人员姓名",
  resolvedAt: null,
  createdAt: "2026-03-20T14:30:00Z"
}
```

### 4. 巡检地点集合 (locations)
```javascript
{
  _id: "自动生成",
  name: "诚信楼",
  campus: "望京校区",
  latitude: 39.998888,
  longitude: 116.417555,
  priority: "high", // high | medium | low
  isActive: true,
  inspectionCount: 45,
  lastInspectionAt: "2026-03-25T10:00:00Z"
}
```

### 5. 系统配置集合 (config)
```javascript
{
  _id: "settings",
  features: {
    locationVerification: true,
    editPermission: false,
    aiProcessing: true,
    voiceInput: true,
    notification: true,
    reportExport: true
  },
  appVersion: "1.0.0",
  updatedAt: "2026-03-25T10:00:00Z"
}
```

## 云函数设计

### 1. 用户登录 (login)
```javascript
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  // 查询用户是否存在
  let user = await db.collection('users').where({
    openid: wxContext.OPENID
  }).get()

  if (user.data.length === 0) {
    // 新用户，创建记录
    const result = await db.collection('users').add({
      data: {
        openid: wxContext.OPENID,
        name: event.name || '新用户',
        role: 'inspector',
        campus: '望京校区',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    return { userId: result._id, isNew: true }
  }

  return { userId: user.data[0]._id, user: user.data[0], isNew: false }
}
```

### 2. 提交巡检记录 (submitInspection)
```javascript
// cloudfunctions/submitInspection/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command

  const data = {
    inspectorId: event.inspectorId,
    inspectorName: event.inspectorName,
    campus: event.campus,
    location: event.location,
    verified: event.verified,
    gpsLatitude: event.gpsLatitude,
    gpsLongitude: event.gpsLongitude,
    result: event.result,
    issue: event.issue,
    severity: event.severity,
    description: event.description,
    aiAnalysis: event.aiAnalysis,
    images: event.images || [],
    audio: event.audio || null,
    status: 'submitted',
    createdAt: new Date()
  }

  // 创建巡检记录
  const result = await db.collection('inspections').add({
    data: data
  })

  // 如果是异常，创建隐患记录
  if (event.result === '异常' && event.issue) {
    await db.collection('hazards').add({
      data: {
        inspectionId: result._id,
        title: `${event.location} - ${event.issue}`,
        type: inferHazardType(event.issue),
        severity: event.severity,
        location: event.location,
        description: event.description,
        status: 'pending',
        createdAt: new Date()
      }
    })
  }

  // 更新地点巡检计数
  await db.collection('locations').where({
    name: event.location
  }).update({
    data: {
      inspectionCount: _.inc(1),
      lastInspectionAt: new Date()
    }
  })

  return { success: true, inspectionId: result._id }
}

function inferHazardType(issue) {
  if (issue.includes('消防') || issue.includes('通道') || issue.includes('灭火')) {
    return '消防安全'
  } else if (issue.includes('电线') || issue.includes('电路') || issue.includes('电器')) {
    return '电气安全'
  } else if (issue.includes('损坏') || issue.includes('破损')) {
    return '设施损坏'
  }
  return '其他'
}
```

### 3. AI分析 (aiAnalysis)
```javascript
// cloudfunctions/aiAnalysis/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  // 调用AI大模型进行智能分析
  // 这里可以接入腾讯云AI或其他AI服务
  const description = event.description

  // 模拟AI分析结果（实际接入时替换为真实AI API）
  const result = {
    location: extractLocation(description),
    issue: extractIssue(description),
    severity: assessSeverity(description),
    result: detectResult(description),
    confidence: 0.85 + Math.random() * 0.14
  }

  return result
}

function extractLocation(text) {
  const locations = ['诚信楼', '宁远楼', '虹远楼', '博学楼', '图书馆', '科研楼',
                    '第一食堂', '第二食堂', '体育馆', '汇德公寓', '教学主楼', '实验大楼']
  for (const loc of locations) {
    if (text.includes(loc)) return loc
  }
  return '未知地点'
}

function extractIssue(text) {
  if (text.includes('正常') || text.includes('良好')) return '设备设施运行正常'
  if (text.includes('消防') && text.includes('阻塞')) return '消防通道阻塞'
  if (text.includes('电线') && text.includes('裸露')) return '电线裸露'
  if (text.includes('照明') && text.includes('损坏')) return '照明设施损坏'
  if (text.includes('灭火器')) return '灭火器过期'
  return '其他安全隐患'
}

function assessSeverity(text) {
  const highRisk = ['阻塞', '裸露', '火灾', '危险', '紧急']
  const mediumRisk = ['损坏', '过期', '故障']
  const lowRisk = ['轻微', '建议']

  for (const word of highRisk) {
    if (text.includes(word)) return 'high'
  }
  for (const word of mediumRisk) {
    if (text.includes(word)) return 'medium'
  }
  for (const word of lowRisk) {
    if (text.includes(word)) return 'low'
  }
  return 'low'
}

function detectResult(text) {
  if (text.includes('正常') || text.includes('良好') || text.includes('无问题')) {
    return '正常'
  }
  return '异常'
}
```

### 4. 数据统计 (getStatistics)
```javascript
// cloudfunctions/getStatistics/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command

  // 总巡检数
  const totalInspections = (await db.collection('inspections').count()).total

  // 正常/异常数量
  const normalInspections = (await db.collection('inspections').where({
    result: '正常'
  }).count()).total

  const abnormalInspections = totalInspections - normalInspections

  // 校区统计
  const wangjing = await db.collection('inspections').where({
    campus: '望京校区'
  }).count()

  const helingli = await db.collection('inspections').where({
    campus: '和平里校区'
  }).count()

  // 隐患统计
  const hazards = await db.collection('hazards').get()
  const hazardStats = {}
  hazards.data.forEach(h => {
    hazardStats[h.type] = (hazardStats[h.type] || 0) + 1
  })

  // 巡检员绩效
  const inspectorStats = await db.collection('inspections')
    .aggregate()
    .group({
      _id: '$inspectorName',
      count: _.sum(1),
      normal: _.sum(_.cond([_.eq('$result', '正常'), 1, 0])),
      abnormal: _.sum(_.cond([_.eq('$result', '异常'), 1, 0]))
    })
    .sort({ count: -1 })
    .limit(6)
    .end()

  return {
    total: totalInspections,
    normal: normalInspections,
    abnormal: abnormalInspections,
    campus: {
      wangjing: wangjing.total,
      helingli: helingli.total
    },
    hazards: hazardStats,
    inspectors: inspectorStats.list
  }
}
```

### 5. 文件上传 (uploadFile)
```javascript
// cloudfunctions/uploadFile/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 文件已由前端上传到云存储，这里返回URL
  return {
    fileID: event.fileID,
    url: `https://${wxContext.ENV}.tcb.qcloud.la/${event.fileID}`
  }
}
```

## 安全规则配置

### 数据库权限规则
```json
{
  "read": "auth.openid == doc.openid || auth.openid == doc.inspectorId",
  "write": "auth.openid == doc.openid"
}
```

管理员需要特殊权限处理，建议使用云函数进行所有数据操作。

## 小程序端改造要点

### 1. 替换localStorage为云数据库
```javascript
// 原本地存储
localStorage.setItem('user', JSON.stringify(user))

// 改为云数据库
const db = wx.cloud.database()
db.collection('users').add({
  data: user
})
```

### 2. 登录改用微信授权
```javascript
wx.getUserProfile({
  desc: '用于完善会员资料',
  success: (res) => {
    wx.cloud.callFunction({
      name: 'login',
      data: {
        name: res.userInfo.nickName
      },
      success: (res) => {
        this.currentUser = res.result.user
      }
    })
  }
})
```

### 3. 图片/音频上传到云存储
```javascript
wx.cloud.uploadFile({
  cloudPath: `inspections/${Date.now()}.jpg`,
  filePath: tempFilePath,
  success: res => {
    const fileID = res.fileID
  }
})
```

### 4. 调用云函数
```javascript
wx.cloud.callFunction({
  name: 'submitInspection',
  data: {
    inspectorId: this.currentUser._id,
    inspectorName: this.currentUser.name,
    campus: this.aiResult.campus,
    location: this.aiResult.location,
    // ...其他字段
  }
})
```

## 迁移步骤

### Phase 1: 基础搭建（1-2天）
1. 开通云开发环境
2. 创建5个数据库集合
3. 部署基础云函数（login, submitInspection）
4. 配置数据库权限规则

### Phase 2: 功能迁移（3-5天）
1. 改造登录流程（微信授权）
2. 替换数据存储（localStorage → 云数据库）
3. 实现文件上传（图片/音频）
4. 对接云函数API

### Phase 3: 完善功能（2-3天）
1. 部署AI分析云函数
2. 部署数据统计云函数
3. 实现实时数据同步
4. 优化错误处理

### Phase 4: 测试发布（2-3天）
1. 完整功能测试
2. 性能优化
3. 提交审核
4. 正式发布

## 注意事项

1. **免费额度**：云开发基础版每月免费额度有限，注意监控用量
2. **数据迁移**：已有的本地测试数据可以导出后通过脚本导入云数据库
3. **性能优化**：合理使用分页和索引，避免一次获取过多数据
4. **安全**：敏感操作（如权限修改）必须通过云函数，不能直接在小程序端操作
5. **AI集成**：可以接入腾讯云AI服务或其他大模型API进行真实AI分析

## 成本估算（基础版免费额度）
- 数据库读操作：5万次/月
- 数据库写操作：3万次/月
- 云存储容量：5GB
- 云函数调用：10万次/月
- CDN流量：5GB/月

**结论**：对于校园巡检系统（假设每天100次巡检），基础版免费额度完全够用。

## 下一步行动

1. 确认是否需要我帮您：
   - 创建完整的云函数代码文件？
   - 编写数据迁移脚本？
   - 修改小程序端代码？
   - 提供更详细的某个云函数实现？

2. 请提供：
   - 云开发环境ID（开通后获取）
   - 是否有真实AI API接入需求？
   - 是否需要对接腾讯云其他服务（如短信验证）？
