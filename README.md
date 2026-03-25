# UIBE CampusSafe - 对外经济贸易大学安全巡检系统

<div align="center">

![UIBE Logo](https://img.shields.io/badge/UIBE-安全巡检系统-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production-ready-brightgreen)

**现代化校园安全巡检管理系统**

[在线演示](#) | [使用文档](#使用文档) | [功能特性](#功能特性)

</div>

---

## 📖 项目简介

UIBE CampusSafe 是专为对外经济贸易大学定制的现代化安全巡检管理系统，采用先进的AI智能识别技术和移动端优先的设计理念，为校园安全管理提供高效、智能的解决方案。

### 核心特色

- 🎨 **专属定制**：采用对外经贸大学品牌色（深蓝 #00205B），融入学校元素
- 🤖 **AI智能识别**：自动识别巡检地点、问题类型和风险等级
- 🎤 **语音输入**：支持语音转文字，提升巡检效率
- 📍 **位置验证**：GPS定位匹配，确保巡检真实性
- 📊 **数据报表**：实时统计分析，多维度数据展示
- 👥 **三角色系统**：管理员、巡检员、报表查看，权限分明

---

## 🚀 快速开始

### 方式一：直接访问（推荐）

将 `app-fixed.html` 部署到任意Web服务器，即可直接使用：

```bash
# 使用Python快速启动本地服务器
python -m http.server 8000

# 或使用Node.js
npx http-server
```

然后在浏览器中打开：`http://localhost:8000/app-fixed.html`

### 方式二：GitHub Pages

1. Fork本仓库
2. 进入Settings → Pages
3. 选择Source为 `main` 分支，文件夹为 `/root`
4. 等待部署完成，访问提供的URL

---

## 📱 功能特性

### 1. 登录系统

- ✅ 微信一键登录
- ✅ 手机验证码登录
- ✅ 自动角色识别
- ✅ 安全认证机制

### 2. 巡检功能（巡检员）

- ✅ 语音输入巡查描述
- ✅ 手动输入文字描述
- ✅ AI智能分析：
  - 自动识别巡检地点
  - 智能识别问题类型
  - 评估风险等级
  - 匹配预设隐患分类
- ✅ 位置验证（GPS匹配）
- ✅ 实时AI分析结果展示
- ✅ 确认上报功能

### 3. 巡检记录

- ✅ 个人巡查历史
- ✅ 统计数据（总数、正常、异常）
- ✅ 记录详情查看
- ✅ 筛选和排序

### 4. 隐患管理

- ✅ 隐患清单查看
- ✅ 按类型分类
- ✅ 按严重程度排序
- ✅ 处理状态追踪

### 5. 管理员后台

- ✅ 用户管理：
  - 用户列表查看
  - 角色升级/降级
  - 校区分配
  - 权限控制
- ✅ 功能管理：
  - 巡查员定位功能开关
  - 巡查结果编辑权限开关
  - AI智能处理开关
  - 语音输入功能开关
  - 消息通知开关
  - 报表分享开关
- ✅ 地点维护：
  - 12个预设地点
  - 校区筛选
  - 启用/禁用地点
  - 巡检次数统计
- ✅ 数据报表：
  - 总体统计
  - 校区对比
  - 隐患问题统计
  - 巡检员绩效排行
  - CSV数据导出

---

## 🎨 界面展示

### 主界面
- 现代化卡片式设计
- 流畅的动画过渡
- 响应式布局
- 深蓝品牌主题

### 巡检输入
- 沉浸式圆形录音按钮
- 实时语音识别
- AI分析结果卡片
- 位置验证状态

### 数据报表
- 直观的数据可视化
- 多维度统计图表
- 动态数据更新
- 导出功能

---

## 📊 技术栈

### 前端
- **框架**：Alpine.js v3.13.8
- **样式**：TailwindCSS
- **图标**：Font Awesome 6.4.0
- **字体**：Google Fonts (Noto Sans SC, Inter, Poppins)
- **API**：Web Speech API（语音识别）

### 后端（云开发版本）
- **云平台**：微信云开发
- **数据库**：云数据库（5个集合）
- **云函数**：8个云函数
- **云存储**：文件存储服务
- **AI服务**：规则引擎（可接入腾讯云AI）

---

## 📂 项目结构

```
Claw/
├── app-fixed.html                 # 主应用文件（可直接部署）
├── README.md                     # 项目说明
├── cloud-development-guide.md      # 云开发对接方案
├── weixin-miniprogram-migration-guide.md  # 小程序迁移指南
│
├── cloudfunctions/               # 云函数（小程序版）
│   ├── login/
│   ├── submitInspection/
│   ├── aiAnalysis/
│   ├── getStatistics/
│   ├── getInspectionRecords/
│   ├── getHazards/
│   ├── getLocations/
│   ├── manageUser/
│   └── getConfig/
│
└── miniprogram-weixin/          # 微信小程序源码
    ├── app.js                   # 小程序主程序
    ├── app.json                 # 小程序配置
    ├── app.wxss                 # 全局样式
    └── pages/                  # 页面目录
```

---

## 🎯 测试账号

| 角色 | 手机号 | 姓名 | 校区 |
|------|--------|------|------|
| 管理员 | 13800138888 | 陈主任 | 望京校区 |
| 巡检员 | 13800138001 | 张保卫 | 望京校区 |
| 巡检员 | 13800138002 | 李保安 | 和平里校区 |
| 巡检员 | 13800138003 | 王巡逻 | 望京校区 |
| 巡检员 | 13800138004 | 刘安全 | 和平里校区 |
| 巡检员 | 13800138005 | 赵监督 | 望京校区 |
| 报表查看 | 13800138006 | 孙分析 | 望京校区 |

> **注意**：超级管理员（13800138888）不可降级

---

## 🏫 校园预设地点

### 望京校区（9个）
- 诚信楼、宁远楼、虹远楼、博学楼、图书馆、科研楼
- 第一食堂、第二食堂、体育馆

### 和平里校区（3个）
- 汇德公寓、教学主楼、实验大楼

---

## 🔧 配置说明

### 功能开关（管理员控制）

1. **巡查员定位功能**：控制位置验证是否必需
2. **巡查结果编辑权限**：控制是否可修改已提交记录
3. **AI智能处理**：控制AI自动识别功能
4. **语音输入功能**：控制语音转文字功能
5. **消息通知**：控制消息推送功能
6. **报表分享**：控制报表导出功能

---

## 📱 微信小程序版本

### 小程序信息
- **小程序ID**：wxa01a88124d29e5a8
- **后端服务**：微信云开发
- **当前状态**：开发中

### 迁移指南
完整的微信小程序迁移指南请参考：
[weixin-miniprogram-migration-guide.md](./weixin-miniprogram-migration-guide.md)

### 云开发方案
详细的云开发对接方案请参考：
[cloud-development-guide.md](./cloud-development-guide.md)

---

## 🎨 品牌设计

### 颜色规范
```css
--uibe-primary: #00205B      /* 对外经贸标准深蓝 */
--uibe-secondary: #0056B3    /* 辅助蓝色 */
--uibe-accent: #E63946      /* 警示红色 */
--uibe-light: #F8FAFF       /* 浅色背景 */
--uibe-warning: #FFB81C      /* 黄色警示 */
--uibe-success: #00A859      /* 成功绿色 */
```

### 设计特点
- 现代化玻璃态设计
- 流畅的动画过渡
- 深蓝色品牌主题
- 对外经贸大学专属元素

---

## 📊 数据统计示例

系统预置了20条巡检记录（2026-03-20 至 2026-03-25），包括：

- 总体统计：总巡检、正常/异常记录、巡检人员
- 校区对比：望京/和平里校区统计
- 隐患问题：按类型统计
- 巡检员绩效：Top 6排行
- 全量记录表格：支持筛选和导出

---

## 🔒 安全特性

- ✅ 基于角色的访问控制
- ✅ 数据加密传输
- ✅ 位置验证机制
- ✅ 审计日志记录
- ✅ 权限分离设计

---

## 🚀 部署指南

### Web版部署

#### 1. 静态服务器部署
```bash
# 复制文件到服务器
cp app-fixed.html /var/www/html/index.html

# 或使用Nginx配置
server {
    listen 80;
    server_name campus-safe.uibe.edu.cn;
    root /var/www/html;
    index index.html;
}
```

#### 2. GitHub Pages部署
1. 推送代码到GitHub
2. 开启Pages功能
3. 选择分支和文件夹
4. 等待部署完成

#### 3. 云服务器部署
```bash
# 使用Vercel
vercel deploy --prod

# 使用Netlify
netlify deploy --prod --dir=.

# 使用阿里云OSS
ossutil cp app-fixed.html oss://your-bucket/index.html
```

### 微信小程序部署

详细步骤请参考 [weixin-miniprogram-migration-guide.md](./weixin-miniprogram-migration-guide.md)

---

## 📈 性能优化

- ✅ 代码压缩和混淆
- ✅ 图片懒加载
- ✅ CDN加速
- ✅ 浏览器缓存
- ✅ 响应式设计
- ✅ 动画性能优化

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议开源。

---

## 📞 联系方式

- **项目地址**：[GitHub Repository](#)
- **问题反馈**：[Issues](#)
- **功能建议**：[Discussions](#)

---

## 🙏 致谢

感谢对外经济贸易大学的支持与信任！

---

<div align="center">

**UIBE CampusSafe - 让校园更安全**

Made with ❤️ for 对外经济贸易大学

</div>
