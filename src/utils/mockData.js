/**
 * Mock 数据 - 基于任务书
 */
import {
  SubTaskType,
  SubTaskTypeName,
  Frequency,
  LayerType,
  IndicatorCategory
} from '../types'

// 生成ID
const generateId = () => Math.random().toString(36).substring(2, 15)

// 任务
export const mockTask = {
  id: 'task_001',
  taskCode: 'XXXXX-2024-001',
  name: 'xxxx进港航道疏浚海洋环境影响跟踪监测',
  startTime: '2024-03-01',
  endTime: '2024-12-31'
}

// 指标定义
export const indicators = {
  // 水质指标
  waterQuality: [
    { id: 'wq_01', name: '水温', category: IndicatorCategory.WATER_QUALITY, unit: '℃' },
    { id: 'wq_02', name: '盐度', category: IndicatorCategory.WATER_QUALITY, unit: '‰' },
    { id: 'wq_03', name: 'pH', category: IndicatorCategory.WATER_QUALITY, unit: '' },
    { id: 'wq_04', name: '溶解氧', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_05', name: 'COD', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_06', name: '氨氮', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_07', name: '硝酸盐', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_08', name: '亚硝酸盐', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_09', name: '活性磷酸盐', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_10', name: '悬浮物', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_11', name: '石油类', category: IndicatorCategory.WATER_QUALITY, unit: 'mg/L' },
    { id: 'wq_12', name: '铜(Cu)', category: IndicatorCategory.WATER_QUALITY, unit: 'μg/L' },
    { id: 'wq_13', name: '铅(Pb)', category: IndicatorCategory.WATER_QUALITY, unit: 'μg/L' },
    { id: 'wq_14', name: '锌(Zn)', category: IndicatorCategory.WATER_QUALITY, unit: 'μg/L' },
    { id: 'wq_15', name: '镉(Cd)', category: IndicatorCategory.WATER_QUALITY, unit: 'μg/L' }
  ],

  // 沉积物指标
  sediment: [
    { id: 'sed_01', name: '有机碳', category: IndicatorCategory.SEDIMENT, unit: '%' },
    { id: 'sed_02', name: '硫化物', category: IndicatorCategory.SEDIMENT, unit: 'mg/kg' },
    { id: 'sed_03', name: '石油类', category: IndicatorCategory.SEDIMENT, unit: 'mg/kg' },
    { id: 'sed_04', name: '锌(Zn)', category: IndicatorCategory.SEDIMENT, unit: 'mg/kg' },
    { id: 'sed_05', name: '铅(Pb)', category: IndicatorCategory.SEDIMENT, unit: 'mg/kg' },
    { id: 'sed_06', name: '铜(Cu)', category: IndicatorCategory.SEDIMENT, unit: 'mg/kg' },
    { id: 'sed_07', name: '镉(Cd)', category: IndicatorCategory.SEDIMENT, unit: 'mg/kg' },
    { id: 'sed_08', name: '粒度', category: IndicatorCategory.SEDIMENT, unit: '' }
  ],

  // 生物指标
  biology: [
    { id: 'bio_01', name: '叶绿素a', category: IndicatorCategory.BIOLOGY, unit: 'mg/m³' },
    { id: 'bio_02', name: '浮游植物', category: IndicatorCategory.BIOLOGY, unit: '种' },
    { id: 'bio_03', name: '浮游动物', category: IndicatorCategory.BIOLOGY, unit: '种' },
    { id: 'bio_04', name: '底栖生物-种类', category: IndicatorCategory.BIOLOGY, unit: '种' },
    { id: 'bio_05', name: '底栖生物-密度', category: IndicatorCategory.BIOLOGY, unit: 'ind/m²' },
    { id: 'bio_06', name: '底栖生物-生物量', category: IndicatorCategory.BIOLOGY, unit: 'g/m²' }
  ],

  // 疏浚泥物理指标
  dredgedMudPhysical: [
    { id: 'dmp_01', name: '粒度', category: IndicatorCategory.DREDGED_MUD_PHYSICAL, unit: '' },
    { id: 'dmp_02', name: '密度', category: IndicatorCategory.DREDGED_MUD_PHYSICAL, unit: 'g/cm³' },
    { id: 'dmp_03', name: '含水率', category: IndicatorCategory.DREDGED_MUD_PHYSICAL, unit: '%' }
  ],

  // 疏浚泥化学指标
  dredgedMudChemical: [
    { id: 'dmc_01', name: '有机碳', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: '%' },
    { id: 'dmc_02', name: '硫化物', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_03', name: '石油类', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_04', name: '铜(Cu)', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_05', name: '锌(Zn)', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_06', name: '铅(Pb)', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_07', name: '镉(Cd)', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_08', name: '铬(Cr)', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_09', name: '砷(As)', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_10', name: '汞(Hg)', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_11', name: '666', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_12', name: 'DDT', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' },
    { id: 'dmc_13', name: 'PCB', category: IndicatorCategory.DREDGED_MUD_CHEMICAL, unit: 'mg/kg' }
  ]
}

// 所有指标列表
export const allIndicators = [
  ...indicators.waterQuality,
  ...indicators.sediment,
  ...indicators.biology,
  ...indicators.dredgedMudPhysical,
  ...indicators.dredgedMudChemical
]

// 柱状样站位 (HD1, HD8, HD14)
const coreStations = ['HD1', 'HD8', 'HD14']

// 疏浚泥监测 - 15个站位
function createDredgedMudStations(subTaskId) {
  const stations = []
  for (let i = 1; i <= 15; i++) {
    const stationCode = `HD${i}`
    const isCore = coreStations.includes(stationCode)
    stations.push({
      id: `dm_station_${i}`,
      subTaskId,
      stationCode,
      hasLayers: isCore, // 柱状样分层
      layers: isCore ? [LayerType.SURFACE, '0.5m', '1m', '1.5m'] : [LayerType.SURFACE],
      monitoringElements: ['疏浚泥'],
      depth: null
    })
  }
  return stations
}

// 水质监测 - 10个站位 (S11-S20), 根据水深判断层次
function createWaterQualityStations(subTaskId) {
  // 根据任务书，S11-S20 各站位监测要素不同
  const stationConfigs = [
    { code: 'S11', elements: ['水质', '沉积物', '生物'], depth: 12 },
    { code: 'S12', elements: ['水质'], depth: 8 },
    { code: 'S13', elements: ['水质', '沉积物', '生物'], depth: 15 },
    { code: 'S14', elements: ['水质', '沉积物', '生物'], depth: 10 },
    { code: 'S15', elements: ['水质'], depth: 6 },
    { code: 'S16', elements: ['水质', '沉积物', '生物'], depth: 18 },
    { code: 'S17', elements: ['水质'], depth: 9 },
    { code: 'S18', elements: ['水质', '生物'], depth: 11 },
    { code: 'S19', elements: ['水质', '沉积物', '生物'], depth: 14 },
    { code: 'S20', elements: ['水质'], depth: 7 }
  ]

  return stationConfigs.map((config, index) => {
    // 水深>10m采表层+底层，≤10m只采表层
    const layers = config.depth > 10
      ? [LayerType.SURFACE, LayerType.BOTTOM]
      : [LayerType.SURFACE]

    return {
      id: `wq_station_${index + 11}`,
      subTaskId,
      stationCode: config.code,
      hasLayers: layers.length > 1,
      layers,
      monitoringElements: config.elements,
      depth: config.depth
    }
  })
}

// 沉积物监测站位 (S11, S13, S14, S16, S19)
function createSedimentStations(subTaskId) {
  const stationCodes = ['S11', 'S13', 'S14', 'S16', 'S19']
  return stationCodes.map((code, index) => ({
    id: `sed_station_${index + 1}`,
    subTaskId,
    stationCode: code,
    hasLayers: false,
    layers: [LayerType.SURFACE],
    monitoringElements: ['沉积物'],
    depth: null
  }))
}

// 生物监测站位 (S11, S13, S14, S16, S18, S19)
function createBiologyStations(subTaskId) {
  const stationCodes = ['S11', 'S13', 'S14', 'S16', 'S18', 'S19']
  return stationCodes.map((code, index) => ({
    id: `bio_station_${index + 1}`,
    subTaskId,
    stationCode: code,
    hasLayers: false,
    layers: [LayerType.SURFACE],
    monitoringElements: ['生物'],
    depth: null
  }))
}

// 渔业资源调查站位 (根据任务书，需覆盖整个工程影响区域)
function createFisheryStations(subTaskId) {
  const stationCodes = ['F01', 'F02', 'F03', 'F04', 'F05']
  return stationCodes.map((code, index) => ({
    id: `fish_station_${index + 1}`,
    subTaskId,
    stationCode: code,
    hasLayers: false,
    layers: [LayerType.SURFACE],
    monitoringElements: ['渔业资源'],
    depth: null
  }))
}

// 环境监视
function createEnvironmentStations(subTaskId) {
  return [{
    id: 'env_station_1',
    subTaskId,
    stationCode: 'EN01',
    hasLayers: false,
    layers: [LayerType.SURFACE],
    monitoringElements: ['环境监视'],
    depth: null
  }]
}

// 子任务
export const mockSubTasks = [
  {
    id: 'sub_001',
    taskId: 'task_001',
    type: SubTaskType.DREDGED_MUD,
    frequency: Frequency.DURING_CONSTRUCTION
  },
  {
    id: 'sub_002',
    taskId: 'task_001',
    type: SubTaskType.WATER_QUALITY,
    frequency: Frequency.DURING_CONSTRUCTION
  },
  {
    id: 'sub_003',
    taskId: 'task_001',
    type: SubTaskType.SEDIMENT,
    frequency: Frequency.DURING_CONSTRUCTION
  },
  {
    id: 'sub_004',
    taskId: 'task_001',
    type: SubTaskType.BIOLOGY,
    frequency: Frequency.DURING_CONSTRUCTION
  },
  {
    id: 'sub_005',
    taskId: 'task_001',
    type: SubTaskType.FISHERY,
    frequency: Frequency.DURING_CONSTRUCTION
  },
  {
    id: 'sub_006',
    taskId: 'task_001',
    type: SubTaskType.ENVIRONMENT,
    frequency: Frequency.DURING_CONSTRUCTION
  }
]

// 根据子任务类型获取站位
export function createStationsForSubTask(subTask) {
  switch (subTask.type) {
    case SubTaskType.DREDGED_MUD:
      return createDredgedMudStations(subTask.id)
    case SubTaskType.WATER_QUALITY:
      return createWaterQualityStations(subTask.id)
    case SubTaskType.SEDIMENT:
      return createSedimentStations(subTask.id)
    case SubTaskType.BIOLOGY:
      return createBiologyStations(subTask.id)
    case SubTaskType.FISHERY:
      return createFisheryStations(subTask.id)
    case SubTaskType.ENVIRONMENT:
      return createEnvironmentStations(subTask.id)
    default:
      return []
  }
}

// 根据子任务类型获取指标
export function getIndicatorsForSubTask(subTaskType) {
  switch (subTaskType) {
    case SubTaskType.DREDGED_MUD:
      return [...indicators.dredgedMudPhysical, ...indicators.dredgedMudChemical]
    case SubTaskType.WATER_QUALITY:
      return indicators.waterQuality
    case SubTaskType.SEDIMENT:
      return indicators.sediment
    case SubTaskType.BIOLOGY:
      return indicators.biology
    case SubTaskType.FISHERY:
      return [] // 渔业资源调查特殊处理
    case SubTaskType.ENVIRONMENT:
      return [] // 环境监视特殊处理
    default:
      return []
  }
}

/**
 * 根据任务和子任务自动生成数据录入矩阵
 * @param {Object} task - 任务
 * @param {Object} subTask - 子任务
 * @param {Array} stations - 站位列表
 * @returns {Array} 数据录入项列表
 */
export function generateDataEntryMatrix(task, subTask, stations) {
  const entries = []
  const taskIndicators = getIndicatorsForSubTask(subTask.type)

  // 渔业资源调查和环境监视特殊处理
  if (subTask.type === SubTaskType.FISHERY || subTask.type === SubTaskType.ENVIRONMENT) {
    // 这些类型不按指标录入，按其他方式处理
    return entries
  }

  stations.forEach(station => {
    station.layers.forEach(layer => {
      taskIndicators.forEach(indicator => {
        entries.push({
          id: generateId(),
          taskId: task.id,
          subTaskId: subTask.id,
          stationId: station.id,
          stationCode: station.stationCode,
          layer: layer,
          indicatorId: indicator.id,
          indicatorName: indicator.name,
          indicatorUnit: indicator.unit,
          value: '',
          status: 'missing' // RecordStatus.MISSING
        })
      })
    })
  })

  return entries
}

/**
 * 初始化完整的Mock数据
 */
export function initializeMockData() {
  const stations = {}
  const dataRecords = {}

  mockSubTasks.forEach(subTask => {
    const subTaskStations = createStationsForSubTask(subTask)
    stations[subTask.id] = subTaskStations

    // 为每个子任务生成数据录入矩阵
    const entries = generateDataEntryMatrix(mockTask, subTask, subTaskStations)
    dataRecords[subTask.id] = entries
  })

  return {
    task: mockTask,
    subTasks: mockSubTasks,
    stations,
    dataRecords,
    indicators: allIndicators
  }
}

export default {
  mockTask,
  mockSubTasks,
  indicators,
  allIndicators,
  createStationsForSubTask,
  getIndicatorsForSubTask,
  generateDataEntryMatrix,
  initializeMockData
}
