// 云函数：AI智能分析
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * AI智能分析云函数
 * 分析巡检描述，提取地点、问题、风险等级等信息
 *
 * @param {Object} event
 * @param {string} event.description - 巡检描述文字
 * @param {string} event.campus - 当前校区（可选）
 * @returns {Object} AI分析结果
 */
exports.main = async (event, context) => {
  const { description, campus } = event

  try {
    console.log('开始AI分析:', description)

    // 简单的规则引擎（可以替换为真实AI API调用）
    const result = analyzeByRules(description, campus)

    console.log('AI分析结果:', result)

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('AI分析失败:', error)
    return {
      success: false,
      error: error.message,
      data: {
        location: '未知地点',
        campus: campus || '望京校区',
        result: '异常',
        issue: '分析失败',
        severity: 'medium',
        confidence: 0,
        keywords: []
      }
    }
  }
}

/**
 * 规则引擎分析（可替换为真实AI API）
 * @param {string} text - 输入文本
 * @param {string} campus - 校区
 * @returns {Object} 分析结果
 */
function analyzeByRules(text, campus) {
  // 望京校区地点列表
  const wangjingLocations = [
    '诚信楼', '宁远楼', '虹远楼', '博学楼', '图书馆', '科研楼',
    '第一食堂', '第二食堂', '体育馆'
  ]

  // 和平里校区地点列表
  const helingliLocations = [
    '汇德公寓', '教学主楼', '实验大楼'
  ]

  // 提取地点
  const location = extractLocation(text, wangjingLocations, helingliLocations)

  // 确定校区
  let detectedCampus = campus || '望京校区'
  if (location) {
    detectedCampus = wangjingLocations.includes(location) ? '望京校区' : '和平里校区'
  }

  // 提取问题
  const { issue, result, severity, type } = extractIssue(text)

  // 提取关键词
  const keywords = extractKeywords(text)

  // 计算置信度
  const confidence = calculateConfidence(text, location, issue)

  return {
    location: location || '未知地点',
    campus: detectedCampus,
    result: result,
    issue: issue,
    severity: severity,
    type: type,
    confidence: confidence,
    keywords: keywords
  }
}

/**
 * 提取地点信息
 * @param {string} text - 输入文本
 * @param {Array} wangjing - 望京校区地点
 * @param {Array} helingli - 和平里校区地点
 * @returns {string|null} 地点名称
 */
function extractLocation(text, wangjing, helingli) {
  const allLocations = [...wangjing, ...helingli]

  // 精确匹配
  for (const loc of allLocations) {
    if (text.includes(loc)) {
      return loc
    }
  }

  // 模糊匹配（去掉"楼"、"公寓"等后缀）
  const simplifiedText = text.replace(/楼|公寓|实验|主楼/g, '')
  for (const loc of allLocations) {
    const simplifiedLoc = loc.replace(/楼|公寓|实验|主楼/g, '')
    if (simplifiedText.includes(simplifiedLoc)) {
      return loc
    }
  }

  return null
}

/**
 * 提取问题描述
 * @param {string} text - 输入文本
 * @returns {Object} { issue, result, severity, type }
 */
function extractIssue(text) {
  // 正常关键词
  const normalKeywords = ['正常', '良好', '无异常', '无问题', '运行正常', '完好']

  // 高风险关键词
  const highRiskKeywords = ['阻塞', '火灾', '危险', '紧急', '严重', '隐患', '事故']

  // 中风险关键词
  const mediumRiskKeywords = ['损坏', '破损', '过期', '故障', '失效', '异常', '不正常']

  // 检查是否正常
  for (const keyword of normalKeywords) {
    if (text.includes(keyword)) {
      return {
        issue: '设备设施运行正常',
        result: '正常',
        severity: 'low',
        type: '常规检查'
      }
    }
  }

  // 检查高风险
  for (const keyword of highRiskKeywords) {
    if (text.includes(keyword)) {
      return {
        issue: inferIssueText(text),
        result: '异常',
        severity: 'high',
        type: inferType(text)
      }
    }
  }

  // 检查中风险
  for (const keyword of mediumRiskKeywords) {
    if (text.includes(keyword)) {
      return {
        issue: inferIssueText(text),
        result: '异常',
        severity: 'medium',
        type: inferType(text)
      }
    }
  }

  // 默认为低风险异常
  return {
    issue: inferIssueText(text) || '发现问题',
    result: '异常',
    severity: 'low',
    type: inferType(text)
  }
}

/**
 * 推断问题类型
 * @param {string} text - 输入文本
 * @returns {string} 问题类型
 */
function inferType(text) {
  const typeRules = [
    { keywords: ['消防', '灭火器', '消防栓', '通道', '安全出口'], type: '消防安全' },
    { keywords: ['电线', '电路', '电器', '插座', '开关'], type: '电气安全' },
    { keywords: ['照明', '灯光', '灯泡', '灯具'], type: '照明设施' },
    { keywords: ['门', '窗', '玻璃', '锁'], type: '门窗设施' },
    { keywords: ['视频', '监控', '摄像头'], type: '安防设施' },
    { keywords: ['地面', '墙面', '天花', '漏水', '渗水'], type: '建筑设施' },
    { keywords: ['食堂', '餐饮', '食品'], type: '食品安全' }
  ]

  for (const rule of typeRules) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return rule.type
      }
    }
  }

  return '常规检查'
}

/**
 * 推断问题描述文字
 * @param {string} text - 输入文本
 * @returns {string} 问题描述
 */
function inferIssueText(text) {
  // 常见问题模式
  const patterns = [
    { regex: /消防.*阻塞/, text: '消防通道阻塞' },
    { regex: /电线.*裸露/, text: '电线裸露' },
    { regex: /灭火器.*过期/, text: '灭火器过期' },
    { regex: /照明.*损坏/, text: '照明设施损坏' },
    { regex: /门.*损坏/, text: '门窗设施损坏' },
    { regex: /漏水/, text: '设施漏水' },
    { regex: /监控.*故障/, text: '监控设施故障' }
  ]

  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return pattern.text
    }
  }

  // 提取关键短语（去除地点名称）
  const cleanedText = text
    .replace(/诚信楼|宁远楼|虹远楼|博学楼|图书馆|科研楼|第一食堂|第二食堂|体育馆|汇德公寓|教学主楼|实验大楼/g, '')
    .replace(/望京校区|和平里校区/g, '')
    .replace(/检查|巡查|巡检|发现|存在/g, '')
    .trim()

  return cleanedText || '发现问题'
}

/**
 * 提取关键词
 * @param {string} text - 输入文本
 * @returns {Array} 关键词数组
 */
function extractKeywords(text) {
  const keywords = []
  const keywordList = [
    '消防', '灭火器', '消防栓', '通道', '安全出口',
    '电线', '电路', '电器', '插座', '开关',
    '照明', '灯光', '灯泡', '灯具',
    '门', '窗', '玻璃', '锁',
    '视频', '监控', '摄像头',
    '损坏', '破损', '过期', '故障',
    '阻塞', '危险', '紧急', '隐患',
    '正常', '良好', '完好', '运行正常'
  ]

  for (const keyword of keywordList) {
    if (text.includes(keyword)) {
      keywords.push(keyword)
    }
  }

  return keywords
}

/**
 * 计算置信度
 * @param {string} text - 输入文本
 * @param {string} location - 提取的地点
 * @param {string} issue - 提取的问题
 * @returns {number} 置信度 (0-1)
 */
function calculateConfidence(text, location, issue) {
  let score = 0.7 // 基础分

  // 如果成功提取到地点，加分
  if (location && location !== '未知地点') {
    score += 0.15
  }

  // 如果成功提取到问题，加分
  if (issue && issue !== '设备设施运行正常') {
    score += 0.1
  }

  // 如果文本包含明确的关键词，加分
  const clearKeywords = ['正常', '异常', '损坏', '故障', '阻塞']
  for (const keyword of clearKeywords) {
    if (text.includes(keyword)) {
      score += 0.05
      break
    }
  }

  return Math.min(score, 0.99)
}

/**
 * TODO: 集成真实AI API
 * 可以接入以下AI服务：
 * 1. 腾讯云AI - 智能文本分析
 * 2. 百度AI - NLP文本审核与分析
 * 3. 阿里云AI - NLP通用能力
 * 4. OpenAI - GPT模型（需要代理）
 *
 * 示例代码（腾讯云AI）：
 */
async function analyzeWithTencentAI(text) {
  // const tencentcloud = require('tencentcloud-sdk-nodejs')
  // const NlpClient = tencentcloud.nlp.v20190408.Client
  //
  // const clientConfig = {
  //   credential: {
  //     secretId: process.env.TENCENT_SECRET_ID,
  //     secretKey: process.env.TENCENT_SECRET_KEY
  //   },
  //   region: process.env.TENCENT_REGION,
  //   profile: {
  //     httpProfile: { endpoint: "nlp.tencentcloudapi.com" }
  //   }
  // }
  //
  // const client = new NlpClient(clientConfig)
  // const params = { Text: text }
  // const result = await client.SentimentAnalysis(params)
  //
  // return result
}
