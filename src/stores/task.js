/**
 * 任务管理 Store
 * 包含任务 CRUD、审批流转、子任务拆解和站点执行进度管理逻辑
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '../utils/storage'
import {
  TaskStatus,
  FlowAction,
  StatusFlow,
  SubTaskType,
  SubTaskStatus,
  SubTaskIndicatorConfig,
  FIXED_SUB_TASK_TYPES,
  ExecutionStatus
} from '../types'
import { useTemplateStore } from './template'

const STORAGE_KEY = 'task_data'
const TASK_FLOW_KEY = 'task_flow'
const SUB_TASKS_KEY = 'sub_tasks'
const EXECUTIONS_KEY = 'executions'

// 生成ID
const generateId = () => Math.random().toString(36).substring(2, 15)

// 获取当前时间
const getCurrentTime = () => new Date().toLocaleString('zh-CN')

export const useTaskStore = defineStore('task', () => {
  // 状态
  const tasks = ref([])
  const taskFlows = ref({}) // { taskId: TaskFlow[] }
  const subTasks = ref([]) // 子任务列表
  const executions = ref([]) // 执行记录列表

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
    // 初始化模板store（必须先加载模板）
    const templateStore = useTemplateStore()
    templateStore.initialize()

    const savedTasks = storage.get(STORAGE_KEY)
    const savedFlows = storage.get(TASK_FLOW_KEY)
    const savedSubTasks = storage.get(SUB_TASKS_KEY)
    const savedExecutions = storage.get(EXECUTIONS_KEY)

    if (savedTasks && savedTasks.length > 0) {
      tasks.value = savedTasks
    } else {
      loadMockData()
    }

    if (savedFlows) taskFlows.value = savedFlows
    if (savedSubTasks) subTasks.value = savedSubTasks
    if (savedExecutions) executions.value = savedExecutions

    isInitialized.value = true
  }

  // 创建固定3个子任务（审批通过后调用）
  function createSubTasksForTask(task) {
    const taskSubTasks = subTasks.value.filter(st => st.taskId === task.id)
    if (taskSubTasks.length > 0) return // 已创建过

    const templateStore = useTemplateStore()

    // 收集所有站点使用的模板类型
    const stations = task.monitoringConfig?.stations || []
    const usedTemplateCodes = new Set()
    stations.forEach(station => {
      (station.subTaskTypes || []).forEach(type => usedTemplateCodes.add(type))
    })

    // 为每个使用的模板类型创建子任务
    usedTemplateCodes.forEach(code => {
      const template = templateStore.getTemplateByCode(code)
      const indicatorIds = template ? template.indicators.map(i => i.id) : []

      const newSubTask = {
        id: generateId(),
        taskId: task.id,
        type: code,
        templateId: template ? template.id : '',
        templateName: template ? template.name : code,
        indicators: indicatorIds,
        status: SubTaskStatus.PENDING
      }
      subTasks.value.push(newSubTask)
    })
  }

  // 根据站点配置生成执行记录（审批通过后调用）
  function generateExecutionsForTask(task) {
    const taskExecutions = executions.value.filter(e => e.taskId === task.id)
    if (taskExecutions.length > 0) return // 已生成过

    const stations = task.monitoringConfig?.stations || []
    const templateStore = useTemplateStore()

    // 遍历每个站点
    stations.forEach(station => {
      // 站点选择的子任务类型（在 station.subTaskTypes 中）
      const selectedTypes = station.subTaskTypes || []

      // 为每个选中的子任务创建执行记录
      selectedTypes.forEach(code => {
        const template = templateStore.getTemplateByCode(code)

        executions.value.push({
          id: generateId(),
          taskId: task.id,
          stationCode: station.code,
          stationName: station.name,
          subTaskType: code,
          templateId: template ? template.id : '',
          status: ExecutionStatus.PENDING,
          dataValue: ''
        })
      })
    })
  }

  // 加载 Mock 数据
  function loadMockData() {
    // 任务1：进行中，已完成部分执行
    const task1Stations = [
      { code: 'S01', name: '监测断面S01', subTaskTypes: ['water', 'biology', 'fishery'] },
      { code: 'S02', name: '监测断面S02', subTaskTypes: ['water', 'environment'] },
      { code: 'S03', name: '监测断面S03', subTaskTypes: ['water', 'sediment', 'intertidal'] },
      { code: 'S04', name: '监测断面S04', subTaskTypes: ['water', 'sediment', 'biology', 'fishery', 'environment'] },
      { code: 'S05', name: '监测断面S05', subTaskTypes: ['sediment', 'biology', 'fishery'] }
    ]

    // 任务2：待审核
    const task2Stations = [
      { code: 'D01', name: '监测断面D01', subTaskTypes: ['water', 'fishery'] },
      { code: 'D02', name: '监测断面D02', subTaskTypes: ['water', 'biology', 'intertidal'] },
      { code: 'D03', name: '监测断面D03', subTaskTypes: ['sediment', 'environment'] }
    ]

    // 任务3：草稿
    const task3Stations = [
      { code: 'Y01', name: '监测断面Y01', subTaskTypes: ['water', 'biology', 'environment'] },
      { code: 'Y02', name: '监测断面Y02', subTaskTypes: ['water', 'fishery', 'intertidal'] }
    ]

    // 任务4：已完成
    const task4Stations = [
      { code: 'A01', name: '监测断面A01', subTaskTypes: ['water', 'sediment', 'fishery'] },
      { code: 'A02', name: '监测断面A02', subTaskTypes: ['water', 'sediment', 'environment'] },
      { code: 'A03', name: '监测断面A03', subTaskTypes: ['water', 'sediment', 'biology', 'fishery', 'intertidal'] }
    ]

    const mockTasks = [
      {
        id: 'task_001',
        taskCode: 'HJ-2026-001',
        name: '2026年第一季度海洋环境监测',
        startTime: '2026-01-01',
        endTime: '2026-03-31',
        frequency: 'quarterly',
        status: TaskStatus.RUNNING,
        description: '第一季度例行海洋环境监测任务',
        creator: '张三',
        createTime: '2026-01-01 09:00',
        rejectReason: '',
        monitoringConfig: { stations: task1Stations }
      },
      {
        id: 'task_002',
        taskCode: 'HJ-2026-002',
        name: '近岸海域专项调查',
        startTime: '2026-02-01',
        endTime: '2026-04-30',
        frequency: 'once',
        status: TaskStatus.PENDING,
        description: '针对近岸新发现污染区域的专项调查',
        creator: '李四',
        createTime: '2026-02-01 10:30',
        rejectReason: '',
        monitoringConfig: { stations: task2Stations }
      },
      {
        id: 'task_003',
        taskCode: 'HJ-2026-003',
        name: '海域生物多样性调查',
        startTime: '2026-03-01',
        endTime: '2026-08-31',
        frequency: 'half_year',
        status: TaskStatus.DRAFT,
        description: '海洋生物多样性半年度调查',
        creator: '王五',
        createTime: '2026-03-15 14:00',
        rejectReason: '',
        monitoringConfig: { stations: task3Stations }
      },
      {
        id: 'task_004',
        taskCode: 'HJ-2025-004',
        name: '2025年度海域监测',
        startTime: '2025-01-01',
        endTime: '2025-12-31',
        frequency: 'yearly',
        status: TaskStatus.COMPLETED,
        description: '2025年度海洋环境综合监测',
        creator: '赵六',
        createTime: '2025-01-01 08:00',
        rejectReason: '',
        monitoringConfig: { stations: task4Stations }
      }
    ]

    tasks.value = mockTasks

    // 流转记录
    const mockFlows = {
      'task_001': [
        { id: 'flow_001', taskId: 'task_001', action: FlowAction.CREATE, operator: '张三', comment: '创建任务', time: '2026-01-01 09:00' },
        { id: 'flow_002', taskId: 'task_001', action: FlowAction.SUBMIT, operator: '张三', comment: '提交季度监测任务', time: '2026-01-02 10:00' },
        { id: 'flow_003', taskId: 'task_001', action: FlowAction.APPROVE, operator: '李四', comment: '审核通过', time: '2026-01-02 14:00' },
        { id: 'flow_004', taskId: 'task_001', action: FlowAction.START, operator: '李四', comment: '任务启动', time: '2026-01-03 09:00' }
      ],
      'task_002': [
        { id: 'flow_005', taskId: 'task_002', action: FlowAction.CREATE, operator: '李四', comment: '创建任务', time: '2026-02-01 10:30' },
        { id: 'flow_006', taskId: 'task_002', action: FlowAction.SUBMIT, operator: '李四', comment: '提交专项调查', time: '2026-02-02 09:00' }
      ],
      'task_003': [
        { id: 'flow_007', taskId: 'task_003', action: FlowAction.CREATE, operator: '王五', comment: '创建任务', time: '2026-03-15 14:00' }
      ],
      'task_004': [
        { id: 'flow_008', taskId: 'task_004', action: FlowAction.CREATE, operator: '赵六', comment: '创建任务', time: '2025-01-01 08:00' },
        { id: 'flow_009', taskId: 'task_004', action: FlowAction.SUBMIT, operator: '赵六', comment: '提交年度监测', time: '2025-01-02 09:00' },
        { id: 'flow_010', taskId: 'task_004', action: FlowAction.APPROVE, operator: '张三', comment: '审核通过', time: '2025-01-02 15:00' },
        { id: 'flow_011', taskId: 'task_004', action: FlowAction.START, operator: '张三', comment: '启动监测', time: '2025-01-03 08:00' },
        { id: 'flow_012', taskId: 'task_004', action: FlowAction.COMPLETE, operator: '赵六', comment: '年度监测完成', time: '2025-12-31 17:00' }
      ]
    }
    taskFlows.value = mockFlows

    // 创建 task_001 的子任务和执行记录（进行中状态）
    createSubTasksForTask(mockTasks[0])
    generateExecutionsForTask(mockTasks[0])

    // task_001: 模拟部分完成
    // 水质：3个站点，1个完成
    // 沉积物：2个站点，1个完成
    // 生物：3个站点，2个完成
    const task001WaterExec = executions.value.filter(e => e.taskId === 'task_001' && e.subTaskType === 'water')
    task001WaterExec[0].status = ExecutionStatus.COMPLETED
    task001WaterExec[0].dataValue = '水温: 18.5; 盐度: 28; pH: 8.2; DO: 6.5'

    const task001SedimentExec = executions.value.filter(e => e.taskId === 'task_001' && e.subTaskType === 'sediment')
    task001SedimentExec[0].status = ExecutionStatus.COMPLETED
    task001SedimentExec[0].dataValue = '有机碳: 1.2; 硫化物: 15; 石油类: 8'

    const task001BiologyExec = executions.value.filter(e => e.taskId === 'task_001' && e.subTaskType === 'biology')
    task001BiologyExec[0].status = ExecutionStatus.COMPLETED
    task001BiologyExec[0].dataValue = '叶绿素a: 3.2; 浮游植物: 45种'
    task001BiologyExec[1].status = ExecutionStatus.COMPLETED
    task001BiologyExec[1].dataValue = '叶绿素a: 2.8; 浮游动物: 32种'

    // 创建 task_004 的子任务和执行记录（已完成状态）
    createSubTasksForTask(mockTasks[3])
    generateExecutionsForTask(mockTasks[3])

    // task_004: 全部完成
    const task004Exec = executions.value.filter(e => e.taskId === 'task_004')
    task004Exec.forEach(exec => {
      exec.status = ExecutionStatus.COMPLETED
      exec.dataValue = '数据已采集并录入系统'
    })

    saveData()
  }

  // 保存数据到 localStorage
  function saveData() {
    storage.set(STORAGE_KEY, tasks.value)
    storage.set(TASK_FLOW_KEY, taskFlows.value)
    storage.set(SUB_TASKS_KEY, subTasks.value)
    storage.set(EXECUTIONS_KEY, executions.value)
  }

  // 重置数据
  function resetData() {
    storage.remove(STORAGE_KEY)
    storage.remove(TASK_FLOW_KEY)
    storage.remove(SUB_TASKS_KEY)
    storage.remove(EXECUTIONS_KEY)
    tasks.value = []
    taskFlows.value = {}
    subTasks.value = []
    executions.value = []
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
        stations: taskData.monitoringConfig?.stations || []
      }
    }

    tasks.value.push(newTask)
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

  // 审核通过 - 自动创建子任务和执行记录
  function approveTask(taskId, operator = '审核人', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.PENDING) {
      return { success: false, message: '只有待审核状态的任务才能审核' }
    }

    task.status = TaskStatus.APPROVED
    addFlow(taskId, FlowAction.APPROVE, operator, comment || '审核通过')

    // 自动创建固定3个子任务
    createSubTasksForTask(task)

    // 根据站点配置生成执行记录
    generateExecutionsForTask(task)

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

  // 启动任务
  function startTask(taskId, operator = '管理员', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.APPROVED) {
      return { success: false, message: '只有已通过审核的任务才能启动' }
    }

    task.status = TaskStatus.RUNNING
    addFlow(taskId, FlowAction.START, operator, comment || '任务启动')

    // 更新所有子任务状态为进行中
    subTasks.value.filter(st => st.taskId === taskId).forEach(st => {
      st.status = SubTaskStatus.RUNNING
    })

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

    // 删除关联的子任务和执行记录
    subTasks.value = subTasks.value.filter(st => st.taskId !== taskId)
    executions.value = executions.value.filter(e => e.taskId !== taskId)

    saveData()
    return { success: true, message: '删除成功' }
  }

  // ========== 子任务相关 ==========

  // 获取任务的子任务列表
  function getSubTasksByTaskId(taskId) {
    return subTasks.value.filter(st => st.taskId === taskId)
  }

  // 获取任务某个子任务的执行记录
  function getExecutionsByTaskIdAndType(taskId, subTaskType) {
    return executions.value.filter(e => e.taskId === taskId && e.subTaskType === subTaskType)
  }

  // 获取任务某个模板的执行记录（兼容subTaskType和templateId两种查找方式）
  function getExecutionsByTemplateId(taskId, templateId) {
    return executions.value.filter(e => e.taskId === taskId && (e.templateId === templateId || e.subTaskType === templateId))
  }

  // 获取任务的所有执行记录
  function getExecutionsByTaskId(taskId) {
    return executions.value.filter(e => e.taskId === taskId)
  }

  // 获取子任务进度（已完成站点数 / 应执行站点数）
  function getSubTaskProgress(taskId, subTaskType) {
    // 同时匹配 templateId 和 subTaskType(code) 兼容新旧数据
    const taskExecutions = executions.value.filter(
      e => e.taskId === taskId && (e.templateId === subTaskType || e.subTaskType === subTaskType)
    )
    if (taskExecutions.length === 0) return 0

    const completedCount = taskExecutions.filter(e => e.status === ExecutionStatus.COMPLETED).length
    return Math.round((completedCount / taskExecutions.length) * 100)
  }

  // 获取任务总进度（各子任务进度的平均值）
  function getTaskProgress(taskId) {
    const taskSubTasks = getSubTasksByTaskId(taskId)
    if (taskSubTasks.length === 0) return 0

    const totalProgress = taskSubTasks.reduce((sum, st) => {
      // 优先用 templateId 查找，否则用 type 兼容旧数据
      const execs = st.templateId
        ? getExecutionsByTemplateId(taskId, st.templateId)
        : getExecutionsByTaskIdAndType(taskId, st.type)
      if (execs.length === 0) return sum
      const completedCount = execs.filter(e => e.status === ExecutionStatus.COMPLETED).length
      return sum + Math.round((completedCount / execs.length) * 100)
    }, 0)
    return Math.round(totalProgress / taskSubTasks.length)
  }

  // 完成执行记录
  function completeExecution(executionId, dataValue = '') {
    const execution = executions.value.find(e => e.id === executionId)
    if (!execution) return { success: false, message: '执行记录不存在' }

    execution.status = ExecutionStatus.COMPLETED
    execution.dataValue = dataValue || '已完成'

    saveData()
    return { success: true, message: '已标记完成' }
  }

  // 获取子任务的指标配置（支持模板ID查找）
  function getSubTaskIndicators(subTaskType) {
    // 先尝试用 subTaskType 当作 templateId 查找
    const templateStore = useTemplateStore()
    const template = templateStore.getTemplateById(subTaskType)
    if (template) {
      return template.indicators
    }
    // 兼容旧数据：尝试当作 code 查找
    const templateByCode = templateStore.getTemplateByCode(subTaskType)
    if (templateByCode) {
      return templateByCode.indicators
    }
    // 兜底：从旧静态配置查找
    return SubTaskIndicatorConfig[subTaskType] || []
  }

  return {
    // 状态
    tasks,
    taskFlows,
    subTasks,
    executions,
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

    // 子任务方法
    getSubTasksByTaskId,
    getExecutionsByTaskIdAndType,
    getExecutionsByTaskId,
    getExecutionsByTemplateId,
    getSubTaskProgress,
    getTaskProgress,
    completeExecution,
    getSubTaskIndicators
  }
})