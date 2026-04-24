/**
 * 任务状态枚举
 */
export const TaskStatus = {
  DRAFT: 'draft',           // 草稿
  PENDING: 'pending',       // 待审核
  APPROVED: 'approved',     // 已通过
  REJECTED: 'rejected',     // 已驳回
  RUNNING: 'running',       // 进行中
  COMPLETED: 'completed'    // 已完成
}

/**
 * 任务状态名称映射
 */
export const TaskStatusName = {
  [TaskStatus.DRAFT]: '草稿',
  [TaskStatus.PENDING]: '待审核',
  [TaskStatus.APPROVED]: '已通过',
  [TaskStatus.REJECTED]: '已驳回',
  [TaskStatus.RUNNING]: '进行中',
  [TaskStatus.COMPLETED]: '已完成'
}

/**
 * 任务状态颜色
 */
export const TaskStatusColor = {
  [TaskStatus.DRAFT]: 'info',
  [TaskStatus.PENDING]: 'warning',
  [TaskStatus.APPROVED]: 'primary',
  [TaskStatus.REJECTED]: 'danger',
  [TaskStatus.RUNNING]: 'success',
  [TaskStatus.COMPLETED]: 'success'
}

/**
 * 流转动作枚举
 */
export const FlowAction = {
  CREATE: 'create',       // 创建
  SUBMIT: 'submit',       // 提交审核
  APPROVE: 'approve',     // 审核通过
  REJECT: 'reject',       // 驳回
  START: 'start',         // 启动任务
  COMPLETE: 'complete'   // 完成任务
}

/**
 * 流转动作名称
 */
export const FlowActionName = {
  [FlowAction.CREATE]: '创建任务',
  [FlowAction.SUBMIT]: '提交审核',
  [FlowAction.APPROVE]: '审核通过',
  [FlowAction.REJECT]: '驳回',
  [FlowAction.START]: '启动任务',
  [FlowAction.COMPLETE]: '完成任务'
}

/**
 * 监测频次枚举
 */
export const Frequency = {
  ONCE: 'once',             // 一次性的
  DAILY: 'daily',           // 每日
  WEEKLY: 'weekly',         // 每周
  MONTHLY: 'monthly',       // 每月
  QUARTERLY: 'quarterly',   // 每季度
  HALF_YEAR: 'half_year',   // 每半年
  YEARLY: 'yearly'          // 每年
}

/**
 * 监测频次名称
 */
export const FrequencyName = {
  [Frequency.ONCE]: '一次性',
  [Frequency.DAILY]: '每日',
  [Frequency.WEEKLY]: '每周',
  [Frequency.MONTHLY]: '每月',
  [Frequency.QUARTERLY]: '每季度',
  [Frequency.HALF_YEAR]: '每半年',
  [Frequency.YEARLY]: '每年'
}

/**
 * 深度类型
 */
export const DepthType = {
  SURFACE: 'surface',           // 表层
  SURFACE_BOTTOM: 'surface_bottom', // 表底层
  CUSTOM: 'custom'               // 自定义
}

/**
 * 深度类型名称
 */
export const DepthTypeName = {
  [DepthType.SURFACE]: '表层',
  [DepthType.SURFACE_BOTTOM]: '表底层',
  [DepthType.CUSTOM]: '自定义'
}

/**
 * 任务 (Task)
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} taskCode 任务编号
 * @property {string} name 任务名称
 * @property {string} startTime 开始时间
 * @property {string} endTime 结束时间
 * @property {Frequency} frequency 监测频次
 * @property {TaskStatus} status 状态
 * @property {MonitoringConfig} monitoringConfig 监测配置
 * @property {string} [description] 任务描述
 * @property {string} creator 创建人
 * @property {string} createTime 创建时间
 * @property {string} [rejectReason] 驳回原因
 */

/**
 * 监测配置 (MonitoringConfig)
 * @typedef {Object} MonitoringConfig
 * @property {StationConfig[]} stations 站位配置列表
 * @property {IndicatorConfig[]} indicators 指标配置列表
 * @property {DepthConfig} depths 深度配置
 */

/**
 * 站位配置 (StationConfig)
 * @typedef {Object} StationConfig
 * @property {string} code 站位编号 (如 S1, HD1)
 * @property {string} name 站位名称
 * @property {string} [longitude] 经度
 * @property {string} [latitude] 纬度
 * @property {number} [depth] 水深(米)
 */

/**
 * 指标配置 (IndicatorConfig)
 * @typedef {Object} IndicatorConfig
 * @property {string} id 指标ID
 * @property {string} name 指标名称
 * @property {string} category 类别
 * @property {string} [unit] 单位
 */

/**
 * 深度配置 (DepthConfig)
 * @typedef {Object} DepthConfig
 * @property {DepthType} type 深度类型
 * @property {string[]} customDepths 自定义深度列表 (如 ['0.5m', '1m', '1.5m'])
 */

/**
 * 流转记录 (TaskFlow)
 * @typedef {Object} TaskFlow
 * @property {string} id
 * @property {string} taskId 关联任务ID
 * @property {FlowAction} action 动作类型
 * @property {string} operator 操作人
 * @property {string} comment 备注/意见
 * @property {string} time 操作时间
 */

/**
 * 状态流转定义
 * 定义每个状态下可以执行的动作
 */
export const StatusFlow = {
  [TaskStatus.DRAFT]: [TaskStatus.PENDING],      // 草稿 -> 待审核
  [TaskStatus.PENDING]: [TaskStatus.APPROVED, TaskStatus.REJECTED],  // 待审核 -> 通过/驳回
  [TaskStatus.APPROVED]: [TaskStatus.RUNNING],   // 已通过 -> 进行中
  [TaskStatus.REJECTED]: [TaskStatus.DRAFT],     // 驳回 -> 草稿
  [TaskStatus.RUNNING]: [TaskStatus.COMPLETED],  // 进行中 -> 已完成
  [TaskStatus.COMPLETED]: []                      // 已完成(终态)
}

/**
 * 监测层次
 */
export const LayerType = {
  SURFACE: 'surface',           // 表层
  BOTTOM: 'bottom',             // 底层
  HALF_METER: '0.5m',          // 0.5米
  ONE_METER: '1m',              // 1米
  ONE_HALF_METER: '1.5m'        // 1.5米
}

/**
 * 监测层次名称
 */
export const LayerTypeName = {
  [LayerType.SURFACE]: '表层',
  [LayerType.BOTTOM]: '底层',
  [LayerType.HALF_METER]: '0.5m',
  [LayerType.ONE_METER]: '1m',
  [LayerType.ONE_HALF_METER]: '1.5m'
}

/**
 * 数据记录状态
 */
export const RecordStatus = {
  FILLED: 'filled',    // 已填写
  MISSING: 'missing'   // 缺失
}

/**
 * 数据录入记录 (DataRecord)
 * @typedef {Object} DataRecord
 * @property {string} id
 * @property {string} taskId 关联任务ID
 * @property {string} stationCode 站位编号
 * @property {string} stationName 站位名称
 * @property {LayerType|string} layer 层次
 * @property {string} indicatorId 指标ID
 * @property {string} indicatorName 指标名称
 * @property {string} indicatorUnit 指标单位
 * @property {string} value 填写的值
 * @property {RecordStatus} status 状态
 */

/**
 * 可用的指标列表 (用于选择)
 */
export const AvailableIndicators = [
  { id: 'wq_01', name: '水温', category: 'water_quality', unit: '℃' },
  { id: 'wq_02', name: '盐度', category: 'water_quality', unit: '‰' },
  { id: 'wq_03', name: 'pH', category: 'water_quality', unit: '' },
  { id: 'wq_04', name: '溶解氧', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_05', name: 'COD', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_06', name: '氨氮', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_07', name: '硝酸盐', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_08', name: '亚硝酸盐', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_09', name: '活性磷酸盐', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_10', name: '悬浮物', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_11', name: '石油类', category: 'water_quality', unit: 'mg/L' },
  { id: 'wq_12', name: '铜(Cu)', category: 'water_quality', unit: 'μg/L' },
  { id: 'wq_13', name: '铅(Pb)', category: 'water_quality', unit: 'μg/L' },
  { id: 'wq_14', name: '锌(Zn)', category: 'water_quality', unit: 'μg/L' },
  { id: 'wq_15', name: '镉(Cd)', category: 'water_quality', unit: 'μg/L' },
  { id: 'sed_01', name: '有机碳', category: 'sediment', unit: '%' },
  { id: 'sed_02', name: '硫化物', category: 'sediment', unit: 'mg/kg' },
  { id: 'sed_03', name: '石油类', category: 'sediment', unit: 'mg/kg' },
  { id: 'sed_04', name: '锌(Zn)', category: 'sediment', unit: 'mg/kg' },
  { id: 'sed_05', name: '铅(Pb)', category: 'sediment', unit: 'mg/kg' },
  { id: 'sed_06', name: '铜(Cu)', category: 'sediment', unit: 'mg/kg' },
  { id: 'sed_07', name: '镉(Cd)', category: 'sediment', unit: 'mg/kg' },
  { id: 'sed_08', name: '粒度', category: 'sediment', unit: '' },
  { id: 'bio_01', name: '叶绿素a', category: 'biology', unit: 'mg/m³' },
  { id: 'bio_02', name: '浮游植物', category: 'biology', unit: '种' },
  { id: 'bio_03', name: '浮游动物', category: 'biology', unit: '种' },
  { id: 'bio_04', name: '底栖生物-种类', category: 'biology', unit: '种' },
  { id: 'bio_05', name: '底栖生物-密度', category: 'biology', unit: 'ind/m²' },
  { id: 'bio_06', name: '底栖生物-生物量', category: 'biology', unit: 'g/m²' }
]

export default {
  TaskStatus,
  TaskStatusName,
  TaskStatusColor,
  FlowAction,
  FlowActionName,
  Frequency,
  FrequencyName,
  DepthType,
  DepthTypeName,
  StatusFlow,
  LayerType,
  LayerTypeName,
  RecordStatus,
  AvailableIndicators
}
