# 微信小程序迁移完整指南

## 📋 迁移清单

### ✅ 已完成的工作

1. **云开发配置**
   - ✅ 创建云开发对接方案文档
   - ✅ 设计数据库结构（5个集合）
   - ✅ 开发8个云函数（login, submitInspection, aiAnalysis, getStatistics, getInspectionRecords, getHazards, getLocations, manageUser, getConfig）

2. **小程序基础架构**
   - ✅ 创建app.js主程序文件
   - ✅ 创建登录页面逻辑
   - ✅ 创建巡检员首页逻辑
   - ✅ 创建巡检输入页面逻辑

### 📝 待完成的工作

#### Phase 1: 小程序基础文件（1-2天）
- [ ] 创建app.json（小程序配置文件）
- [ ] 创建app.wxss（全局样式）
- [ ] 创建project.config.json（项目配置）
- [ ] 创建所有页面的.wxml和.wxss文件
- [ ] 实现底部导航栏
- [ ] 实现顶部导航栏

#### Phase 2: 页面开发（3-5天）
- [ ] 完善登录页面UI（.wxml + .wxss）
- [ ] 完善巡检员工作台UI
- [ ] 完善巡检输入页面UI
- [ ] 完善巡检记录列表UI
- [ ] 完善隐患清单UI
- [ ] 完善管理员控制台UI
- [ ] 完善报表查看页UI

#### Phase 3: 功能实现（2-3天）
- [ ] 实现微信登录流程
- [ ] 实现手机号验证码登录
- [ ] 实现语音录制和识别
- [ ] 实现图片上传到云存储
- [ ] 实现位置验证
- [ ] 实现所有云函数调用

#### Phase 4: 数据初始化（1天）
- [ ] 创建数据库初始化脚本
- [ ] 导入12个预设地点数据
- [ ] 导入7个测试用户数据
- [ ] 导入20条模拟巡检记录
- [ ] 创建系统配置文档

#### Phase 5: 测试和优化（2-3天）
- [ ] 功能测试
- [ ] UI适配测试（不同尺寸设备）
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 用户体验优化

#### Phase 6: 发布准备（1-2天）
- [ ] 提交小程序审核
- [ ] 配置服务器域名
- [ ] 配置业务域名
- [ ] 编写使用说明文档

## 📂 文件结构

```
Claw/
├── cloudfunctions/          # 云函数目录
│   ├── login/              # 用户登录
│   ├── submitInspection/   # 提交巡检
│   ├── aiAnalysis/         # AI分析
│   ├── getStatistics/      # 数据统计
│   ├── getInspectionRecords/ # 巡检记录
│   ├── getHazards/         # 隐患列表
│   ├── getLocations/       # 地点列表
│   ├── manageUser/         # 用户管理
│   ├── getConfig/          # 系统配置
│   └── package.json        # 云函数配置
│
├── miniprogram-weixin/      # 小程序源码
│   ├── app.js              # 小程序逻辑
│   ├── app.json            # 小程序配置
│   ├── app.wxss            # 小程序样式
│   ├── pages/              # 页面目录
│   │   ├── login/          # 登录页
│   │   │   ├── login.js
│   │   │   ├── login.json
│   │   │   ├── login.wxml
│   │   │   └── login.wxss
│   │   ├── inspector/      # 巡检员页面
│   │   │   ├── home/       # 工作台
│   │   │   ├── input/      # 巡检输入
│   │   │   ├── records/    # 巡检记录
│   │   │   └── hazards/    # 隐患清单
│   │   ├── admin/          # 管理员页面
│   │   │   ├── home/       # 管理控制台
│   │   │   ├── users/      # 用户管理
│   │   │   ├── features/   # 功能管理
│   │   │   └── reports/    # 数据报表
│   │   └── viewer/         # 报表查看页
│   │       └── home/
│   ├── components/         # 组件目录
│   ├── utils/              # 工具函数
│   └── images/             # 图片资源
│
├── app-fixed.html          # 当前Web版本
├── cloud-development-guide.md  # 云开发方案
└── weixin-miniprogram-migration-guide.md  # 本文档
```

## 🚀 快速开始步骤

### 1. 创建小程序项目

1. 打开微信开发者工具
2. 选择"小程序"
3. 填写项目信息：
   - 项目名称: UIBE CampusSafe
   - 目录: `c:/Users/ianxi/WorkBuddy/Claw/miniprogram-weixin`
   - AppID: wxa01a88124d29e5a8
   - 开发模式: 小程序
   - 后端服务: 云开发

### 2. 开通云开发环境

1. 在微信开发者工具中，点击"云开发"按钮
2. 创建新环境：
   - 环境名称: uibe-campus-safe
   - 基础版: 勾选（免费额度够用）
3. 等待环境创建完成（约2分钟）
4. 记录环境ID（格式: cloud1-xxx）

### 3. 修改app.js中的环境ID

```javascript
// miniprogram-weixin/app.js
globalData: {
  env: 'your-env-id' // 替换为实际的环境ID
}
```

### 4. 部署云函数

在微信开发者工具中：
1. 右键点击 `cloudfunctions` 目录
2. 选择"上传并部署：云端安装依赖"
3. 逐个部署所有云函数：
   - login
   - submitInspection
   - aiAnalysis
   - getStatistics
   - getInspectionRecords
   - getHazards
   - getLocations
   - manageUser
   - getConfig

### 5. 创建数据库集合

在云开发控制台的数据库中创建以下集合：

#### users（用户表）
```javascript
// 添加权限规则
{
  "read": "auth.openid == doc.openid || auth.openid == doc.inspectorId",
  "write": "auth.openid == doc.openid"
}

// 添加测试数据
[
  {
    "_openid": "xxx", // 自动生成
    "openid": "xxx",
    "name": "陈主任",
    "phone": "13800138888",
    "role": "admin",
    "campus": "望京校区",
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-20T10:00:00Z"
  },
  // ... 其他6个测试用户
]
```

#### inspections（巡检记录表）
```javascript
// 权限规则
{
  "read": "auth.openid == doc.openid || auth.openid == doc.inspectorId",
  "write": false // 只能通过云函数写入
}
```

#### hazards（隐患表）
```javascript
// 权限规则
{
  "read": true,
  "write": false
}
```

#### locations（地点表）
```javascript
// 权限规则
{
  "read": true,
  "write": false
}

// 预设数据
[
  { "name": "诚信楼", "campus": "望京校区", "latitude": 39.998888, "longitude": 116.417555, "priority": "high", "isActive": true },
  { "name": "宁远楼", "campus": "望京校区", "latitude": 39.999111, "longitude": 116.418222, "priority": "high", "isActive": true },
  // ... 其他10个地点
]
```

#### config（配置表）
```javascript
// 权限规则
{
  "read": true,
  "write": false
}

// 初始配置
{
  "_id": "settings",
  "features": {
    "locationVerification": true,
    "editPermission": false,
    "aiProcessing": true,
    "voiceInput": true,
    "notification": true,
    "reportExport": true
  },
  "appVersion": "1.0.0",
  "updatedAt": "2026-03-20T10:00:00Z"
}
```

### 6. 运行小程序

1. 点击微信开发者工具的"编译"按钮
2. 在模拟器中预览
3. 扫码在真机上测试

## 🔑 关键技术要点

### 1. 微信登录流程

```javascript
// 1. 获取用户信息
wx.getUserProfile({
  desc: '用于完善会员资料',
  success: (res) => {
    // 2. 调用登录云函数
    wx.cloud.callFunction({
      name: 'login',
      data: { name: res.userInfo.nickName },
      success: (loginRes) => {
        // 3. 保存用户信息
        app.globalData.userInfo = loginRes.result.user
        // 4. 跳转到对应页面
      }
    })
  }
})
```

### 2. 语音识别

使用微信实时语音识别API：
```javascript
// 1. 配置app.json
{
  "permission": {
    "scope.record": {
      "desc": "用于语音输入巡查描述"
    }
  }
}

// 2. 使用录音管理器
const recorderManager = wx.getRecorderManager()
recorderManager.start({
  duration: 60000,
  format: 'mp3'
})

// 3. 调用语音识别API
wx.cloud.callFunction({
  name: 'recognizeVoice', // 需要创建此云函数
  data: { filePath: tempFilePath }
})
```

### 3. 云存储上传

```javascript
// 1. 选择图片
wx.chooseImage({
  count: 9,
  success: (res) => {
    // 2. 上传到云存储
    wx.cloud.uploadFile({
      cloudPath: `inspections/${Date.now()}.jpg`,
      filePath: res.tempFilePaths[0],
      success: (uploadRes) => {
        console.log('上传成功:', uploadRes.fileID)
        // 3. 保存fileID到数据库
      }
    })
  }
})
```

### 4. 位置获取和验证

```javascript
// 1. 获取当前位置
wx.getLocation({
  type: 'gcj02',
  success: (res) => {
    const { latitude, longitude } = res
    // 2. 计算与目标地点的距离
    const distance = calculateDistance(
      latitude, longitude,
      targetLat, targetLon
    )
    // 3. 判断是否在范围内（如100米内）
  }
})
```

## 📊 数据迁移脚本

### 1. 导入地点数据

创建脚本 `cloudfunctions/initData/index.js`:

```javascript
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()

exports.main = async (event, context) => {
  const locations = [
    { name: '诚信楼', campus: '望京校区', latitude: 39.998888, longitude: 116.417555, priority: 'high', isActive: true },
    { name: '宁远楼', campus: '望京校区', latitude: 39.999111, longitude: 116.418222, priority: 'high', isActive: true },
    { name: '虹远楼', campus: '望京校区', latitude: 39.997777, longitude: 116.419333, priority: 'medium', isActive: true },
    { name: '博学楼', campus: '望京校区', latitude: 39.996666, longitude: 116.417777, priority: 'high', isActive: true },
    { name: '图书馆', campus: '望京校区', latitude: 39.998333, longitude: 116.420111, priority: 'high', isActive: true },
    { name: '科研楼', campus: '望京校区', latitude: 39.997444, longitude: 116.416888, priority: 'medium', isActive: true },
    { name: '第一食堂', campus: '望京校区', latitude: 39.996555, longitude: 116.419444, priority: 'medium', isActive: true },
    { name: '第二食堂', campus: '望京校区', latitude: 39.997222, longitude: 116.420555, priority: 'medium', isActive: true },
    { name: '体育馆', campus: '望京校区', latitude: 39.996888, longitude: 116.418666, priority: 'medium', isActive: true },
    { name: '汇德公寓', campus: '和平里校区', latitude: 39.935555, longitude: 116.414444, priority: 'high', isActive: true },
    { name: '教学主楼', campus: '和平里校区', latitude: 39.936666, longitude: 116.415555, priority: 'high', isActive: true },
    { name: '实验大楼', campus: '和平里校区', latitude: 39.937777, longitude: 116.416666, priority: 'high', isActive: true }
  ]

  for (const loc of locations) {
    await db.collection('locations').add({
      data: {
        ...loc,
        inspectionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  return { success: true, count: locations.length }
}
```

### 2. 导入测试用户数据

```javascript
const users = [
  { name: '陈主任', phone: '13800138888', role: 'admin', campus: '望京校区' },
  { name: '张保卫', phone: '13800138001', role: 'inspector', campus: '望京校区' },
  { name: '李保安', phone: '13800138002', role: 'inspector', campus: '和平里校区' },
  { name: '王巡逻', phone: '13800138003', role: 'inspector', campus: '望京校区' },
  { name: '刘安全', phone: '13800138004', role: 'inspector', campus: '和平里校区' },
  { name: '赵监督', phone: '13800138005', role: 'inspector', campus: '望京校区' },
  { name: '孙分析', phone: '13800138006', role: 'viewer', campus: '望京校区' }
]

// 注意：用户数据需要在第一次登录时通过login云函数自动创建
// 或者手动在数据库控制台添加
```

## ⚠️ 注意事项

1. **云开发免费额度**：
   - 数据库读: 5万次/月
   - 数据库写: 3万次/月
   - 云函数调用: 10万次/月
   - 云存储: 5GB
   - CDN流量: 5GB/月
   - 对于校园巡检系统（假设每天100次巡检），免费额度完全够用

2. **权限控制**：
   - 敏感操作（用户管理、权限修改）必须在云函数中进行
   - 小程序端直接操作数据库的权限要严格限制
   - 使用openid进行身份验证

3. **数据安全**：
   - 不要在小程序端存储敏感信息
   - 使用云函数进行数据加密
   - 定期备份数据库

4. **性能优化**：
   - 合理使用分页
   - 避免一次获取过多数据
   - 图片上传前进行压缩
   - 使用缓存减少云函数调用

5. **用户体验**：
   - 加载状态提示
   - 错误提示友好
   - 网络异常处理
   - 离线提示

## 📞 下一步行动

请告诉我您需要：
1. 创建完整的页面UI文件（.wxml + .wxss）？
2. 创建数据初始化云函数？
3. 实现更多页面的逻辑代码？
4. 配置小程序的app.json？
5. 其他具体需求？

我会根据您的需求继续完成小程序的开发工作。
