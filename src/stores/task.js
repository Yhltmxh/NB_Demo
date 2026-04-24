/**
 * 任务管理 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '../utils/storage'
import mockData from '../utils/mockData'
import { validateTask, getMissingItems, getMissingItemsByStation, getMissingItemsByIndicator } from '../utils/validation'
import { RecordStatus, SubTaskType } from '../types'

const STORAGE_KEY = 'task_data'

export const useTaskStore = defineStore('task', () => {
  // 状态
  const task = ref(null)
  const subTasks = ref([])
  const stations = ref({}) // { subTaskId: stations[] }
  const dataRecords = ref({}) // { subTaskId: records[] }
  const indicators = ref([])

  // 初始化状态
  const isInitialized = ref(false)

  // 计算属性
  const taskList = computed(() => {
    return task.value ? [task.value] : []
  })

  const getSubTasksByTaskId = computed(() => {
    return (taskId) => subTasks.value.filter(st => st.taskId === taskId)
  })

  const getStationsBySubTaskId = computed(() => {
    return (subTaskId) => stations.value[subTaskId] || []
  })

  const getDataRecordsBySubTaskId = computed(() => {
    return (subTaskId) => dataRecords.value[subTaskId] || []
  })

  // 初始化
  function initialize() {
    // 先尝试从 localStorage 加载
    const savedData = storage.get(STORAGE_KEY)

    if (savedData) {
      task.value = savedData.task
      subTasks.value = savedData.subTasks
      stations.value = savedData.stations
      dataRecords.value = savedData.dataRecords
      indicators.value = savedData.indicators
    } else {
      // 加载 Mock 数据
      loadMockData()
    }

    isInitialized.value = true
  }

  // 加载 Mock 数据
  function loadMockData() {
    const mock = mockData.initializeMockData()
    task.value = mock.task
    subTasks.value = mock.subTasks
    stations.value = mock.stations
    dataRecords.value = mock.dataRecords
    indicators.value = mock.indicators
    saveData()
  }

  // 保存数据到 localStorage
  function saveData() {
    const data = {
      task: task.value,
      subTasks: subTasks.value,
      stations: stations.value,
      dataRecords: dataRecords.value,
      indicators: indicators.value
    }
    storage.set(STORAGE_KEY, data)
  }

  // 重置数据
  function resetData() {
    storage.remove(STORAGE_KEY)
    loadMockData()
  }

  // 更新数据记录
  function updateDataRecord(subTaskId, recordId, value) {
    const records = dataRecords.value[subTaskId]
    if (!records) return

    const record = records.find(r => r.id === recordId)
    if (record) {
      record.value = value
      record.status = value !== '' ? RecordStatus.FILLED : RecordStatus.MISSING
      saveData()
    }
  }

  // 批量更新数据记录
  function batchUpdateDataRecords(subTaskId, updates) {
    const records = dataRecords.value[subTaskId]
    if (!records) return

    updates.forEach(update => {
      const record = records.find(r => r.id === update.id)
      if (record) {
        record.value = update.value
        record.status = update.value !== '' ? RecordStatus.FILLED : RecordStatus.MISSING
      }
    })
    saveData()
  }

  // 校验任务
  function validateTaskById(taskId) {
    return validateTask(
      { subTasks: subTasks.value, stations: stations.value, dataRecords: dataRecords.value },
      taskId
    )
  }

  // 获取缺失项
  function getMissingItemsByTaskId(taskId) {
    return getMissingItems(
      { subTasks: subTasks.value, stations: stations.value, dataRecords: dataRecords.value },
      taskId
    )
  }

  // 按站位统计缺失项
  function getMissingByStation(taskId) {
    return getMissingItemsByStation(
      { subTasks: subTasks.value, stations: stations.value, dataRecords: dataRecords.value },
      taskId
    )
  }

  // 按指标统计缺失项
  function getMissingByIndicator(taskId) {
    return getMissingItemsByIndicator(
      { subTasks: subTasks.value, stations: stations.value, dataRecords: dataRecords.value },
      taskId
    )
  }

  // 获取任务完成率
  function getCompletionRate(taskId) {
    const validation = validateTaskById(taskId)
    return validation.statistics.completionRate
  }

  // 获取每个子任务的完成率
  function getSubTaskCompletionRates(taskId) {
    const taskSubTasks = subTasks.value.filter(st => st.taskId === taskId)
    return taskSubTasks.map(st => {
      const validation = validateTask(
        { subTasks: [st], stations: stations.value, dataRecords: dataRecords.value },
        taskId
      )
      return {
        subTaskId: st.id,
        subTaskType: st.type,
        ...validation.statistics
      }
    })
  }

  // 获取任务树形结构
  function getTaskTree(taskId) {
    const taskData = task.value
    const taskSubTasks = subTasks.value.filter(st => st.taskId === taskId)

    const children = taskSubTasks.map(st => {
      const subTaskStations = stations.value[st.id] || []
      return {
        id: st.id,
        label: getSubTaskTypeName(st.type),
        type: 'subTask',
        children: subTaskStations.map(s => ({
          id: s.id,
          label: `${s.stationCode}${s.hasLayers ? '(分层)' : ''}`,
          type: 'station'
        }))
      }
    })

    return {
      id: taskData.id,
      label: taskData.name,
      type: 'task',
      children
    }
  }

  // 获取子任务类型名称
  function getSubTaskTypeName(type) {
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

  // 获取指标列表
  function getIndicatorById(indicatorId) {
    return indicators.value.find(i => i.id === indicatorId)
  }

  // 获取特定子任务类型的所有指标
  function getIndicatorsByCategory(category) {
    return indicators.value.filter(i => i.category === category)
  }

  return {
    // 状态
    task,
    subTasks,
    stations,
    dataRecords,
    indicators,
    isInitialized,

    // 计算属性
    taskList,
    getSubTasksByTaskId,
    getStationsBySubTaskId,
    getDataRecordsBySubTaskId,

    // 方法
    initialize,
    loadMockData,
    saveData,
    resetData,
    updateDataRecord,
    batchUpdateDataRecords,
    validateTaskById,
    getMissingItemsByTaskId,
    getMissingByStation,
    getMissingByIndicator,
    getCompletionRate,
    getSubTaskCompletionRates,
    getTaskTree,
    getSubTaskTypeName,
    getIndicatorById,
    getIndicatorsByCategory
  }
})
