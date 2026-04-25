/**
 * 任务管理 Store
 * 包含任务 CRUD、审批流转、数据录入和子任务拆解进度管理逻辑
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '../utils/storage'
import {
  TaskStatus,
  FlowAction,
  StatusFlow,
  RecordStatus,
  LayerType,
  DepthType,
  SubTaskType,
  SubTaskStatus,
  SubTaskIndicatorConfig,
  ExecutionStatus
} from '../types'

const STORAGE_KEY = 'task_data'
const TASK_FLOW_KEY = 'task_flow'
const DATA_RECORDS_KEY = 'data_records'
const SUB_TASKS_KEY = 'sub_tasks'
const SUB_TASK_EXECUTIONS_KEY = 'sub_task_executions'

// 生成ID
const generateId = () => Math.random().toString(36).substring(2, 15)

// 获取当前时间
const getCurrentTime = () => new Date().toLocaleString('zh-CN')

export const useTaskStore = defineStore('task', () => {
  // 状态
  const tasks = ref([])
  const taskFlows = ref({}) // { taskId: TaskFlow[] }
  const dataRecords = ref({}) // { taskId: DataRecord[] }
  const subTasks = ref([]) // 子任务列表
  const subTaskExecutions = ref([]) // 子任务执行记录列表

  // 是否已初始化
  const isInitialized = ref(false)

  // 计算属性
  const taskList = computed(() => tasks.value)

  // 按状态筛选任务
  const getTasksByStatus = computed(() => {
    return (status) => tasks.value.filter(t => t.status === status)
  })

  // 获取任务流转记录
  const getFlowsByTaskId = computed(() => {
    return (taskId) => taskFlows.value[taskId] || []
  })

  // 初始化
  function initialize() {
    const savedTasks = storage.get(STORAGE_KEY)
    const savedFlows = storage.get(TASK_FLOW_KEY)
    const savedRecords = storage.get(DATA_RECORDS_KEY)
    const savedSubTasks = storage.get(SUB_TASKS_KEY)
    const savedExecutions = storage.get(SUB_TASK_EXECUTIONS_KEY)

    if (savedTasks && savedTasks.length > 0) {
      tasks.value = savedTasks
    } else {
      loadMockData()
    }

    if (savedFlows) taskFlows.value = savedFlows
    if (savedRecords) dataRecords.value = savedRecords
    if (savedSubTasks) subTasks.value = savedSubTasks
    if (savedExecutions) subTaskExecutions.value = savedExecutions

    isInitialized.value = true
  }

  // 根据监测配置生成数据录入矩阵
  function generateDataEntryMatrix(task) {
    const records = []
    const { stations, indicators, depths } = task.monitoringConfig

    let layers = []
    if (depths.type === DepthType.SURFACE) {
      layers = [LayerType.SURFACE]
    } else if (depths.type === DepthType.SURFACE_BOTTOM) {
      layers = [LayerType.SURFACE, LayerType.BOTTOM]
    } else if (depths.type === DepthType.CUSTOM) {
      layers = depths.customDepths || []
    }

    stations.forEach(station => {
      const effectiveLayers = (depths.type === DepthType.SURFACE_BOTTOM && station.depth <= 10)
        ? [LayerType.SURFACE]
        : layers

      effectiveLayers.forEach(layer => {
        indicators.forEach(indicator => {
          records.push({
            id: generateId(),
            taskId: task.id,
            stationCode: station.code,
            stationName: station.name,
            layer: layer,
            indicatorId: indicator.id,
            indicatorName: indicator.name,
            indicatorUnit: indicator.unit || '',
            value: '',
            status: RecordStatus.MISSING
          })
        })
      })
    })

    return records
  }

  // 为任务创建子任务（审批通过后调用）
  function createSubTasksForTask(task) {
    const taskSubTasks = subTasks.value.filter(st => st.taskId === task.id)
    if (taskSubTasks.length > 0) return // 已创建过

    // 从任务的 monitoringConfig 中获取配置的子任务类型
    // 这里我们根据任务中已有的指标来判断子任务类型
    const indicators = task.monitoringConfig.indicators || []
    const indicatorCategories = [...new Set(indicators.map(i => i.category))]

    const subTaskTypes = []
    if (indicatorCategories.includes('water_quality')) subTaskTypes.push(SubTaskType.WATER)
    if (indicatorCategories.includes('sediment')) subTaskTypes.push(SubTaskType.SEDIMENT)
    if (indicatorCategories.includes('biology')) subTaskTypes.push(SubTaskType.BIOLOGY)
    if (indicatorCategories.includes('fishery')) subTaskTypes.push(SubTaskType.FISHERY)

    // 如果没有匹配的类型，但任务有指标，则创建一个通用的子任务
    if (subTaskTypes.length === 0 && indicators.length > 0) {
      subTaskTypes.push(SubTaskType.WATER)
    }

    // 为每个子任务类型创建子任务
    subTaskTypes.forEach(type => {
      const subTaskIndicators = SubTaskIndicatorConfig[type] || []
      const indicatorIds = subTaskIndicators.map(i => i.id)

      const newSubTask = {
        id: generateId(),
        taskId: task.id,
        type: type,
        indicators: indicatorIds,
        status: SubTaskStatus.PENDING
      }
      subTasks.value.push(newSubTask)

      // 为该子任务创建执行记录（每个站位一个）
      task.monitoringConfig.stations.forEach(station => {
        subTaskExecutions.value.push({
          id: generateId(),
          taskId: task.id,
          subTaskId: newSubTask.id,
          stationCode: station.code,
          stationName: station.name,
          progress: 0,
          status: ExecutionStatus.NOT_STARTED
        })
      })
    })
  }

  // 加载 Mock 数据
  function loadMockData() {
    const mockTasks = [
      {
        id: 'task_001',
        taskCode: 'HJ-2024-001',
        name: '第一季度水质监测任务',
        startTime: '2024-01-01',
        endTime: '2024-03-31',
        frequency: 'quarterly',
        status: TaskStatus.RUNNING,
        description: '第一季度例行水质监测任务',
        creator: '张三',
        createTime: '2024-01-01 09:00',
        rejectReason: '',
        monitoringConfig: {
          stations: [
            { code: 'S01', name: '监测点1', longitude: '121°30\'', latitude: '31°20\'', depth: 10 },
            { code: 'S02', name: '监测点2', longitude: '121°31\'', latitude: '31°21\'', depth: 15 },
            { code: 'S03', name: '监测点3', longitude: '121°32\'', latitude: '31°22\'', depth: 8 }
          ],
          indicators: [
            { id: 'wq_01', name: '水温', category: 'water_quality', unit: '℃' },
            { id: 'wq_02', name: '盐度', category: 'water_quality', unit: '‰' },
            { id: 'wq_03', name: 'pH', category: 'water_quality', unit: '' },
            { id: 'wq_04', name: '溶解氧', category: 'water_quality', unit: 'mg/L' }
          ],
          depths: { type: 'surface_bottom', customDepths: [] }
        }
      },
      {
        id: 'task_002',
        taskCode: 'HJ-2024-002',
        name: '沉积物专项调查',
        startTime: '2024-02-01',
        endTime: '2024-04-30',
        frequency: 'once',
        status: TaskStatus.PENDING,
        description: '针对新发现区域的沉积物专项调查',
        creator: '李四',
        createTime: '2024-02-01 10:30',
        rejectReason: '',
        monitoringConfig: {
          stations: [
            { code: 'HD01', name: '疏浚区1', longitude: '121°28\'', latitude: '31°18\'' },
            { code: 'HD02', name: '疏浚区2', longitude: '121°29\'', latitude: '31°19\'' }
          ],
          indicators: [
            { id: 'sed_01', name: '有机碳', category: 'sediment', unit: '%' },
            { id: 'sed_02', name: '硫化物', category: 'sediment', unit: 'mg/kg' },
            { id: 'sed_03', name: '石油类', category: 'sediment', unit: 'mg/kg' }
          ],
          depths: { type: 'surface', customDepths: [] }
        }
      },
      {
        id: 'task_003',
        taskCode: 'HJ-2024-003',
        name: '生物多样性年度调查',
        startTime: '2024-03-01',
        endTime: '2024-11-30',
        frequency: 'yearly',
        status: TaskStatus.DRAFT,
        description: '年度生物多样性调查任务',
        creator: '王五',
        createTime: '2024-02-15 14:00',
        rejectReason: '',
        monitoringConfig: {
          stations: [
            { code: 'B01', name: '生物监测点1', longitude: '121°30\'', latitude: '31°20\'' },
            { code: 'B02', name: '生物监测点2', longitude: '121°31\'', latitude: '31°21\'' },
            { code: 'B03', name: '生物监测点3', longitude: '121°32\'', latitude: '31°22\'' },
            { code: 'B04', name: '生物监测点4', longitude: '121°33\'', latitude: '31°23\'' }
          ],
          indicators: [
            { id: 'bio_01', name: '叶绿素a', category: 'biology', unit: 'mg/m³' },
            { id: 'bio_02', name: '浮游植物', category: 'biology', unit: '种' },
            { id: 'bio_03', name: '浮游动物', category: 'biology', unit: '种' },
            { id: 'bio_04', name: '底栖生物-种类', category: 'biology', unit: '种' }
          ],
          depths: { type: 'surface', customDepths: [] }
        }
      }
    ]

    tasks.value = mockTasks

    const mockFlows = {
      'task_001': [
        { id: 'flow_001', taskId: 'task_001', action: FlowAction.CREATE, operator: '张三', comment: '创建任务', time: '2024-01-01 09:00' },
        { id: 'flow_002', taskId: 'task_001', action: FlowAction.SUBMIT, operator: '张三', comment: '提交审核', time: '2024-01-02 10:00' },
        { id: 'flow_003', taskId: 'task_001', action: FlowAction.APPROVE, operator: '李四', comment: '审核通过', time: '2024-01-02 14:00' },
        { id: 'flow_004', taskId: 'task_001', action: FlowAction.START, operator: '李四', comment: '任务启动', time: '2024-01-03 09:00' }
      ],
      'task_002': [
        { id: 'flow_005', taskId: 'task_002', action: FlowAction.CREATE, operator: '李四', comment: '创建任务', time: '2024-02-01 10:30' },
        { id: 'flow_006', taskId: 'task_002', action: FlowAction.SUBMIT, operator: '李四', comment: '提交审核', time: '2024-02-02 09:00' }
      ]
    }
    taskFlows.value = mockFlows

    // 为 task_001 生成一些数据记录和子任务执行
    const mockRecords = {
      'task_001': generateMockDataRecords('task_001')
    }
    dataRecords.value = mockRecords

    // 为 task_001 创建子任务和执行记录（模拟已进行中）
    createMockSubTasksAndExecutions()

    saveData()
  }

  // 生成带假数据的数据记录
  function generateMockDataRecords(taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return []

    const records = generateDataEntryMatrix(task)
    records.forEach((record, index) => {
      if (Math.random() > 0.3) {
        record.value = (Math.random() * 100).toFixed(2)
        record.status = RecordStatus.FILLED
      }
    })
    return records
  }

  // 创建模拟的子任务和执行记录
  function createMockSubTasksAndExecutions() {
    const task = tasks.value.find(t => t.id === 'task_001')
    if (!task) return

    // 创建水质子任务
    const waterSubTask = {
      id: 'sub_001',
      taskId: 'task_001',
      type: SubTaskType.WATER,
      indicators: SubTaskIndicatorConfig[SubTaskType.WATER].map(i => i.id),
      status: SubTaskStatus.RUNNING
    }
    subTasks.value.push(waterSubTask)

    // 为水质子任务创建执行记录
    task.monitoringConfig.stations.forEach((station, idx) => {
      subTaskExecutions.value.push({
        id: `exec_${idx}`,
        taskId: 'task_001',
        subTaskId: 'sub_001',
        stationCode: station.code,
        stationName: station.name,
        progress: idx === 0 ? 100 : idx === 1 ? 50 : 0,
        status: idx === 0 ? ExecutionStatus.COMPLETED : idx === 1 ? ExecutionStatus.IN_PROGRESS : ExecutionStatus.NOT_STARTED
      })
    })
  }

  // 保存数据到 localStorage
  function saveData() {
    storage.set(STORAGE_KEY, tasks.value)
    storage.set(TASK_FLOW_KEY, taskFlows.value)
    storage.set(DATA_RECORDS_KEY, dataRecords.value)
    storage.set(SUB_TASKS_KEY, subTasks.value)
    storage.set(SUB_TASK_EXECUTIONS_KEY, subTaskExecutions.value)
  }

  // 重置数据
  function resetData() {
    storage.remove(STORAGE_KEY)
    storage.remove(TASK_FLOW_KEY)
    storage.remove(DATA_RECORDS_KEY)
    storage.remove(SUB_TASKS_KEY)
    storage.remove(SUB_TASK_EXECUTIONS_KEY)
    tasks.value = []
    taskFlows.value = {}
    dataRecords.value = {}
    subTasks.value = []
    subTaskExecutions.value = []
    loadMockData()
  }

  // 创建任务
  function createTask(taskData) {
    const newTask = {
      id: generateId(),
      taskCode: taskData.taskCode,
      name: taskData.name,
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      frequency: taskData.frequency,
      status: TaskStatus.DRAFT,
      description: taskData.description || '',
      creator: taskData.creator || '当前用户',
      createTime: getCurrentTime(),
      rejectReason: '',
      monitoringConfig: {
        stations: taskData.monitoringConfig?.stations || [],
        indicators: taskData.monitoringConfig?.indicators || [],
        depths: taskData.monitoringConfig?.depths || { type: 'surface', customDepths: [] }
      }
    }

    tasks.value.push(newTask)
    dataRecords.value[newTask.id] = generateDataEntryMatrix(newTask)
    addFlow(newTask.id, FlowAction.CREATE, newTask.creator, '创建任务')

    saveData()
    return newTask
  }

  // 更新任务
  function updateTask(taskId, taskData) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      const task = tasks.value[index]
      if (task.status !== TaskStatus.DRAFT && task.status !== TaskStatus.REJECTED) {
        return { success: false, message: '当前状态不允许编辑' }
      }

      tasks.value[index] = { ...task, ...taskData, id: taskId }
      dataRecords.value[taskId] = generateDataEntryMatrix(tasks.value[index])

      saveData()
      return { success: true, message: '更新成功' }
    }
    return { success: false, message: '任务不存在' }
  }

  // 提交审核
  function submitTask(taskId, operator = '当前用户', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.DRAFT && task.status !== TaskStatus.REJECTED) {
      return { success: false, message: '只有草稿或驳回状态的任务才能提交' }
    }

    task.status = TaskStatus.PENDING
    task.rejectReason = ''
    addFlow(taskId, FlowAction.SUBMIT, operator, comment || '提交审核')

    saveData()
    return { success: true, message: '提交成功' }
  }

  // 审核通过
  function approveTask(taskId, operator = '审核人', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.PENDING) {
      return { success: false, message: '只有待审核状态的任务才能审核' }
    }

    task.status = TaskStatus.APPROVED
    addFlow(taskId, FlowAction.APPROVE, operator, comment || '审核通过')

    saveData()
    return { success: true, message: '审核通过' }
  }

  // 驳回任务
  function rejectTask(taskId, operator = '审核人', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.PENDING) {
      return { success: false, message: '只有待审核状态的任务才能驳回' }
    }

    if (!comment) {
      return { success: false, message: '驳回时必须填写意见' }
    }

    task.status = TaskStatus.REJECTED
    task.rejectReason = comment
    addFlow(taskId, FlowAction.REJECT, operator, comment)

    saveData()
    return { success: true, message: '已驳回' }
  }

  // 启动任务 - 关键：自动创建子任务和执行记录
  function startTask(taskId, operator = '管理员', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.APPROVED) {
      return { success: false, message: '只有已通过审核的任务才能启动' }
    }

    task.status = TaskStatus.RUNNING
    addFlow(taskId, FlowAction.START, operator, comment || '任务启动')

    // 自动创建子任务和执行记录
    createSubTasksForTask(task)

    saveData()
    return { success: true, message: '任务已启动' }
  }

  // 完成任务
  function completeTask(taskId, operator = '管理员', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.RUNNING) {
      return { success: false, message: '只有进行中的任务才能完成' }
    }

    task.status = TaskStatus.COMPLETED
    addFlow(taskId, FlowAction.COMPLETE, operator, comment || '任务完成')

    // 更新所有子任务状态
    subTasks.value.filter(st => st.taskId === taskId).forEach(st => {
      st.status = SubTaskStatus.COMPLETED
    })
    // 更新所有执行记录状态
    subTaskExecutions.value.filter(e => e.taskId === taskId).forEach(e => {
      e.progress = 100
      e.status = ExecutionStatus.COMPLETED
    })

    saveData()
    return { success: true, message: '任务已完成' }
  }

  // 添加流转记录
  function addFlow(taskId, action, operator, comment) {
    if (!taskFlows.value[taskId]) {
      taskFlows.value[taskId] = []
    }

    taskFlows.value[taskId].push({
      id: generateId(),
      taskId,
      action,
      operator,
      comment,
      time: getCurrentTime()
    })
  }

  // 获取任务详情
  function getTaskById(taskId) {
    return tasks.value.find(t => t.id === taskId)
  }

  // 获取某个任务可用的下一个状态
  function getNextStatus(currentStatus) {
    return StatusFlow[currentStatus] || []
  }

  // 判断任务是否可以执行某个动作
  function canExecuteAction(taskId, action) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return false

    switch (action) {
      case FlowAction.SUBMIT:
        return task.status === TaskStatus.DRAFT || task.status === TaskStatus.REJECTED
      case FlowAction.APPROVE:
      case FlowAction.REJECT:
        return task.status === TaskStatus.PENDING
      case FlowAction.START:
        return task.status === TaskStatus.APPROVED
      case FlowAction.COMPLETE:
        return task.status === TaskStatus.RUNNING
      default:
        return false
    }
  }

  // 删除任务
  function deleteTask(taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.DRAFT) {
      return { success: false, message: '只能删除草稿状态的任务' }
    }

    const index = tasks.value.findIndex(t => t.id === taskId)
    tasks.value.splice(index, 1)

    delete taskFlows.value[taskId]
    delete dataRecords.value[taskId]

    // 删除关联的子任务和执行记录
    subTasks.value = subTasks.value.filter(st => st.taskId !== taskId)
    subTaskExecutions.value = subTaskExecutions.value.filter(e => e.taskId !== taskId)

    saveData()
    return { success: true, message: '删除成功' }
  }

  // ========== 数据录入相关 ==========

  function getDataRecordsByTaskId(taskId) {
    if (!dataRecords.value[taskId]) {
      const task = getTaskById(taskId)
      if (task) {
        dataRecords.value[taskId] = generateDataEntryMatrix(task)
        saveData()
      }
    }
    return dataRecords.value[taskId] || []
  }

  function updateDataRecord(taskId, recordId, value) {
    const records = dataRecords.value[taskId]
    if (!records) return

    const record = records.find(r => r.id === recordId)
    if (record) {
      record.value = value
      record.status = value !== '' ? RecordStatus.FILLED : RecordStatus.MISSING
      saveData()
    }
  }

  function batchUpdateDataRecords(taskId, updates) {
    const records = dataRecords.value[taskId]
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

  function getDataCompletionRate(taskId) {
    const records = getDataRecordsByTaskId(taskId)
    if (records.length === 0) return 100
    const filledCount = records.filter(r => r.status === RecordStatus.FILLED && r.value !== '').length
    return Math.round((filledCount / records.length) * 100)
  }

  function getDataStatistics(taskId) {
    const records = getDataRecordsByTaskId(taskId)
    const total = records.length
    const filled = records.filter(r => r.status === RecordStatus.FILLED && r.value !== '').length
    const missing = total - filled
    return { total, filled, missing, completionRate: total > 0 ? Math.round((filled / total) * 100) : 100 }
  }

  function getMissingItems(taskId) {
    const records = getDataRecordsByTaskId(taskId)
    return records.filter(r => r.status === RecordStatus.MISSING || r.value === '')
  }

  function getMissingByStation(taskId) {
    const missingRecords = getMissingItems(taskId)
    const byStation = {}

    missingRecords.forEach(record => {
      const key = `${record.stationCode}-${record.layer}`
      if (!byStation[key]) {
        byStation[key] = { stationCode: record.stationCode, layer: record.layer, indicators: [] }
      }
      byStation[key].indicators.push({ name: record.indicatorName, unit: record.indicatorUnit })
    })

    return Object.values(byStation)
  }

  // ========== 子任务相关 ==========

  // 获取任务的子任务列表
  function getSubTasksByTaskId(taskId) {
    return subTasks.value.filter(st => st.taskId === taskId)
  }

  // 获取子任务的执行记录
  function getSubTaskExecutions(subTaskId) {
    return subTaskExecutions.value.filter(e => e.subTaskId === subTaskId)
  }

  // 获取任务的执行记录
  function getExecutionsByTaskId(taskId) {
    return subTaskExecutions.value.filter(e => e.taskId === taskId)
  }

  // 获取子任务进度
  function getSubTaskProgress(subTaskId) {
    const executions = getSubTaskExecutions(subTaskId)
    if (executions.length === 0) return 0

    const totalProgress = executions.reduce((sum, e) => sum + e.progress, 0)
    return Math.round(totalProgress / executions.length)
  }

  // 获取任务总进度
  function getTaskProgress(taskId) {
    const taskSubTasks = getSubTasksByTaskId(taskId)
    if (taskSubTasks.length === 0) return 0

    const totalProgress = taskSubTasks.reduce((sum, st) => sum + getSubTaskProgress(st.id), 0)
    return Math.round(totalProgress / taskSubTasks.length)
  }

  // 完成执行记录（轻量模拟：点击标记完成）
  function completeExecution(executionId) {
    const execution = subTaskExecutions.value.find(e => e.id === executionId)
    if (!execution) return { success: false, message: '执行记录不存在' }

    execution.progress = 100
    execution.status = ExecutionStatus.COMPLETED

    // 检查子任务是否全部完成
    const subTaskExec = getSubTaskExecutions(execution.subTaskId)
    const allCompleted = subTaskExec.every(e => e.status === ExecutionStatus.COMPLETED)
    if (allCompleted) {
      const subTask = subTasks.value.find(st => st.id === execution.subTaskId)
      if (subTask) subTask.status = SubTaskStatus.COMPLETED
    }

    // 更新子任务状态为进行中（如果还不是）
    const subTask = subTasks.value.find(st => st.id === execution.subTaskId)
    if (subTask && subTask.status === SubTaskStatus.PENDING) {
      subTask.status = SubTaskStatus.RUNNING
    }

    saveData()
    return { success: true, message: '已标记完成' }
  }

  // 更新执行记录进度
  function updateExecutionProgress(executionId, progress) {
    const execution = subTaskExecutions.value.find(e => e.id === executionId)
    if (!execution) return

    execution.progress = Math.min(100, Math.max(0, progress))
    execution.status = progress >= 100 ? ExecutionStatus.COMPLETED
      : progress > 0 ? ExecutionStatus.IN_PROGRESS
      : ExecutionStatus.NOT_STARTED

    saveData()
  }

  return {
    // 状态
    tasks,
    taskFlows,
    dataRecords,
    subTasks,
    subTaskExecutions,
    isInitialized,

    // 计算属性
    taskList,
    getTasksByStatus,
    getFlowsByTaskId,

    // 任务管理方法
    initialize,
    loadMockData,
    saveData,
    resetData,
    createTask,
    updateTask,
    submitTask,
    approveTask,
    rejectTask,
    startTask,
    completeTask,
    getTaskById,
    getNextStatus,
    canExecuteAction,
    deleteTask,

    // 数据录入方法
    getDataRecordsByTaskId,
    updateDataRecord,
    batchUpdateDataRecords,
    getDataCompletionRate,
    getDataStatistics,
    getMissingItems,
    getMissingByStation,

    // 子任务方法
    getSubTasksByTaskId,
    getSubTaskExecutions,
    getExecutionsByTaskId,
    getSubTaskProgress,
    getTaskProgress,
    completeExecution,
    updateExecutionProgress
  }
})