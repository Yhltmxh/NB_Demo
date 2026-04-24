/**
 * 指标完整性校验逻辑
 */
import { RecordStatus, SubTaskType, LayerType } from '../types'

/**
 * 校验任务完整性
 * @param {Object} taskStore - 任务Store
 * @param {string} taskId - 任务ID
 * @returns {Object} 校验结果
 */
export function validateTask(taskStore, taskId) {
  const subTasks = taskStore.subTasks.filter(st => st.taskId === taskId)
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    statistics: {
      totalItems: 0,
      filledItems: 0,
      missingItems: 0,
      completionRate: 0
    }
  }

  subTasks.forEach(subTask => {
    const subTaskValidation = validateSubTask(taskStore, subTask)
    result.statistics.totalItems += subTaskValidation.statistics.totalItems
    result.statistics.filledItems += subTaskValidation.statistics.filledItems
    result.statistics.missingItems += subTaskValidation.statistics.missingItems

    if (!subTaskValidation.isValid) {
      result.isValid = false
      result.errors.push(...subTaskValidation.errors)
    }
    result.warnings.push(...subTaskValidation.warnings)
  })

  if (result.statistics.totalItems > 0) {
    result.statistics.completionRate =
      Math.round((result.statistics.filledItems / result.statistics.totalItems) * 100)
  }

  return result
}

/**
 * 校验子任务完整性
 * @param {Object} taskStore - 任务Store
 * @param {Object} subTask - 子任务
 * @returns {Object} 校验结果
 */
export function validateSubTask(taskStore, subTask) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    statistics: {
      totalItems: 0,
      filledItems: 0,
      missingItems: 0,
      completionRate: 0
    }
  }

  const stations = taskStore.stations[subTask.id] || []
  const records = taskStore.dataRecords[subTask.id] || []

  // 按站位统计
  const stationStats = {}
  stations.forEach(station => {
    stationStats[station.id] = {
      stationCode: station.stationCode,
      total: 0,
      filled: 0,
      missing: 0,
      layers: {}
    }
  })

  // 统计每个站位-层次-指标的数据
  records.forEach(record => {
    const station = stations.find(s => s.id === record.stationId)
    if (!station) return

    const layerKey = record.layer || 'surface'
    if (!stationStats[record.stationId].layers[layerKey]) {
      stationStats[record.stationId].layers[layerKey] = { total: 0, filled: 0 }
    }

    stationStats[record.stationId].total++
    stationStats[record.stationId].layers[layerKey].total++

    if (record.status === RecordStatus.FILLED && record.value !== '') {
      stationStats[record.stationId].filled++
      stationStats[record.stationId].layers[layerKey].filled++
    } else {
      stationStats[record.stationId].missing++
      result.errors.push({
        type: 'missing_data',
        subTaskType: subTask.type,
        stationCode: station.stationCode,
        layer: record.layer,
        indicatorName: record.indicatorName
      })
    }
  })

  result.statistics.totalItems = records.length
  result.statistics.filledItems = records.filter(
    r => r.status === RecordStatus.FILLED && r.value !== ''
  ).length
  result.statistics.missingItems = result.statistics.totalItems - result.statistics.filledItems

  if (result.statistics.totalItems > 0) {
    result.statistics.completionRate =
      Math.round((result.statistics.filledItems / result.statistics.totalItems) * 100)
  }

  // 检查特殊规则
  checkSpecialRules(taskStore, subTask, stations, result)

  result.isValid = result.errors.length === 0

  return result
}

/**
 * 检查特殊业务规则
 * @param {Object} taskStore - 任务Store
 * @param {Object} subTask - 子任务
 * @param {Array} stations - 站位列表
 * @param {Object} result - 结果对象
 */
function checkSpecialRules(taskStore, subTask, stations, result) {
  // 疏浚泥监测 - 柱状样站位必须有多层数据
  if (subTask.type === SubTaskType.DREDGED_MUD) {
    const coreStations = ['HD1', 'HD8', 'HD14']
    stations.forEach(station => {
      if (coreStations.includes(station.stationCode)) {
        const expectedLayers = [LayerType.SURFACE, '0.5m', '1m', '1.5m']
        const records = taskStore.dataRecords[subTask.id] || []
        const stationRecords = records.filter(r => r.stationId === station.id)

        expectedLayers.forEach(layer => {
          const layerRecords = stationRecords.filter(r => r.layer === layer)
          if (layerRecords.length === 0) {
            result.warnings.push({
              type: 'missing_layer',
              stationCode: station.stationCode,
              layer,
              message: `柱状样站位 ${station.stationCode} 缺少 ${layer} 数据`
            })
          }
        })
      }
    })
  }

  // 水质监测 - 根据水深判断层次
  if (subTask.type === SubTaskType.WATER_QUALITY) {
    stations.forEach(station => {
      if (station.depth > 10) {
        // 水深>10m，需要表层和底层
        const records = taskStore.dataRecords[subTask.id] || []
        const stationRecords = records.filter(r => r.stationId === station.id)
        const hasSurface = stationRecords.some(r => r.layer === LayerType.SURFACE)
        const hasBottom = stationRecords.some(r => r.layer === LayerType.BOTTOM)

        if (!hasSurface) {
          result.warnings.push({
            type: 'missing_layer',
            stationCode: station.stationCode,
            layer: LayerType.SURFACE,
            message: `站位 ${station.stationCode} 水深${station.depth}m > 10m，需表层数据`
          })
        }
        if (!hasBottom) {
          result.warnings.push({
            type: 'missing_layer',
            stationCode: station.stationCode,
            layer: LayerType.BOTTOM,
            message: `站位 ${station.stationCode} 水深${station.depth}m > 10m，需底层数据`
          })
        }
      }
    })
  }
}

/**
 * 获取缺失项列表
 * @param {Object} taskStore - 任务Store
 * @param {string} taskId - 任务ID
 * @returns {Array} 缺失项列表
 */
export function getMissingItems(taskStore, taskId) {
  const missingItems = []
  const subTasks = taskStore.subTasks.filter(st => st.taskId === taskId)

  subTasks.forEach(subTask => {
    const stations = taskStore.stations[subTask.id] || []
    const records = taskStore.dataRecords[subTask.id] || []

    records.forEach(record => {
      if (record.status !== RecordStatus.FILLED || record.value === '') {
        const station = stations.find(s => s.id === record.stationId)
        missingItems.push({
          subTaskType: subTask.type,
          subTaskName: getSubTaskName(subTask.type),
          stationCode: record.stationCode,
          layer: record.layer,
          indicatorName: record.indicatorName,
          indicatorId: record.indicatorId
        })
      }
    })
  })

  return missingItems
}

/**
 * 获取完成率
 * @param {Object} taskStore - 任务Store
 * @param {string} taskId - 任务ID
 * @returns {number} 完成率百分比
 */
export function getCompletionRate(taskStore, taskId) {
  const validation = validateTask(taskStore, taskId)
  return validation.statistics.completionRate
}

/**
 * 按站位统计缺失项
 * @param {Object} taskStore - 任务Store
 * @param {string} taskId - 任务ID
 * @returns {Object} 按站位统计的缺失项
 */
export function getMissingItemsByStation(taskStore, taskId) {
  const missingByStation = {}
  const missingItems = getMissingItems(taskStore, taskId)

  missingItems.forEach(item => {
    const key = `${item.stationCode}-${item.layer || 'surface'}`
    if (!missingByStation[key]) {
      missingByStation[key] = {
        stationCode: item.stationCode,
        layer: item.layer,
        subTaskType: item.subTaskType,
        subTaskName: item.subTaskName,
        missingIndicators: []
      }
    }
    missingByStation[key].missingIndicators.push(item.indicatorName)
  })

  return Object.values(missingByStation)
}

/**
 * 按指标统计缺失项
 * @param {Object} taskStore - 任务Store
 * @param {string} taskId - 任务ID
 * @returns {Object} 按指标统计的缺失项
 */
export function getMissingItemsByIndicator(taskStore, taskId) {
  const missingByIndicator = {}
  const missingItems = getMissingItems(taskStore, taskId)

  missingItems.forEach(item => {
    if (!missingByIndicator[item.indicatorName]) {
      missingByIndicator[item.indicatorName] = {
        indicatorName: item.indicatorName,
        subTaskName: item.subTaskName,
        count: 0,
        stations: []
      }
    }
    missingByIndicator[item.indicatorName].count++
    if (!missingByIndicator[item.indicatorName].stations.includes(item.stationCode)) {
      missingByIndicator[item.indicatorName].stations.push(item.stationCode)
    }
  })

  return Object.values(missingByIndicator)
}

/**
 * 获取子任务类型名称
 */
function getSubTaskName(type) {
  const names = {
    [SubTaskType.DREDGED_MUD]: '疏浚泥监测',
    [SubTaskType.WATER_QUALITY]: '水质监测',
    [SubTaskType.SEDIMENT]: '沉积物监测',
    [SubTaskType.BIOLOGY]: '生物监测',
    [SubTaskType.FISHERY]: '渔业资源调查',
    [SubTaskType.ENVIRONMENT]: '环境监视'
  }
  return names[type] || type
}

export default {
  validateTask,
  validateSubTask,
  getMissingItems,
  getCompletionRate,
  getMissingItemsByStation,
  getMissingItemsByIndicator
}
