/**
 * 任务
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} taskCode 任务编号
 * @property {string} name 任务名称
 * @property {string} startTime 开始时间
 * @property {string} endTime 结束时间
 */

/**
 * 子任务类型枚举
 */
export const SubTaskType = {
  DREDGED_MUD: 'dredged_mud',        // 疏浚泥监测
  WATER_QUALITY: 'water_quality',    // 水质监测
  SEDIMENT: 'sediment',              // 沉积物监测
  BIOLOGY: 'biology',               // 生物监测
  FISHERY: 'fishery',                // 渔业资源调查
  ENVIRONMENT: 'environment'          // 环境监视
}

/**
 * 子任务类型名称映射
 */
export const SubTaskTypeName = {
  [SubTaskType.DREDGED_MUD]: '疏浚泥监测',
  [SubTaskType.WATER_QUALITY]: '水质监测',
  [SubTaskType.SEDIMENT]: '沉积物监测',
  [SubTaskType.BIOLOGY]: '生物监测',
  [SubTaskType.FISHERY]: '渔业资源调查',
  [SubTaskType.ENVIRONMENT]: '环境监视'
}

/**
 * 监测频率
 */
export const Frequency = {
  DURING_CONSTRUCTION: 'during_construction',  // 施工中
  AFTER_CONSTRUCTION: 'after_construction'      // 施工后
}

/**
 * 监测层次
 */
export const LayerType = {
  SURFACE: 'surface',              // 表层
  BOTTOM: 'bottom',                // 底层
  HALF_METER: '0.5m',            // 0.5米
  ONE_METER: '1m',                // 1米
  ONE_HALF_METER: '1.5m'          // 1.5米
}

/**
 * 子任务
 * @typedef {Object} SubTask
 * @property {string} id
 * @property {string} taskId 所属任务ID
 * @property {SubTaskType} type 子任务类型
 * @property {Frequency} frequency 监测频率
 */

/**
 * 站位
 * @typedef {Object} Station
 * @property {string} id
 * @property {string} subTaskId 所属子任务ID
 * @property {string} stationCode 站位编号 (如 HD1, S11)
 * @property {boolean} hasLayers 是否分层
 * @property {LayerType[]} layers 层次列表
 * @property {string[]} monitoringElements 监测要素 (水质/沉积物/生物)
 * @property {number} depth 水深(米), 用于水质监测判断层次
 */

/**
 * 指标类别
 */
export const IndicatorCategory = {
  WATER_QUALITY: 'water_quality',    // 水质指标
  SEDIMENT: 'sediment',              // 沉积物指标
  BIOLOGY: 'biology',               // 生物指标
  DREDGED_MUD_PHYSICAL: 'dredged_mud_physical',  // 疏浚泥物理指标
  DREDGED_MUD_CHEMICAL: 'dredged_mud_chemical'   // 疏浚泥化学指标
}

/**
 * 指标定义
 * @typedef {Object} Indicator
 * @property {string} id
 * @property {string} name 指标名称
 * @property {IndicatorCategory} category 类别
 * @property {string} [unit] 单位
 */

/**
 * 数据记录状态
 */
export const RecordStatus = {
  FILLED: 'filled',    // 已填写
  MISSING: 'missing'   // 缺失
}

/**
 * 数据录入记录
 * @typedef {Object} DataRecord
 * @property {string} id
 * @property {string} taskId
 * @property {string} subTaskId
 * @property {string} stationId
 * @property {LayerType} [layer] 层次
 * @property {string} indicatorId
 * @property {string} value 填写的值
 * @property {RecordStatus} status 状态
 */

/**
 * 数据录入项 - 自动生成的结构
 * @typedef {Object} DataEntryItem
 * @property {string} stationCode 站位编号
 * @property {LayerType} [layer] 层次
 * @property {string} indicatorName 指标名称
 * @property {string} indicatorId 指标ID
 * @property {string} [value] 填写的值
 * @property {RecordStatus} status 状态
 */
