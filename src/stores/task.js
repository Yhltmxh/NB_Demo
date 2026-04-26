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

    // 创建固定的3个子任务
    FIXED_SUB_TASK_TYPES.forEach(type => {
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
    })
  }

  // 根据站点配置生成执行记录（审批通过后调用）
  function generateExecutionsForTask(task) {
    const taskExecutions = executions.value.filter(e => e.taskId === task.id)
    if (taskExecutions.length > 0) return // 已生成过

    const stations = task.monitoringConfig?.stations || []

    // 遍历每个站点
    stations.forEach(station => {
      // 站点选择的子任务类型（在 station.subTaskTypes 中）
      const selectedTypes = station.subTaskTypes || []

      // 为每个选中的子任务创建执行记录
      selectedTypes.forEach(subTaskType => {
        executions.value.push({
          id: generateId(),
          taskId: task.id,
          stationCode: station.code,
          stationName: station.name,
          subTaskType: subTaskType,
          status: ExecutionStatus.PENDING,
          dataValue: ''
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
            { code: 'S01', name: '监测点1', subTaskTypes: ['water', 'biology'] },
            { code: 'S02', name: '监测点2', subTaskTypes: ['water'] },
            { code: 'S03', name: '监测点3', subTaskTypes: ['sediment', 'biology'] }
          ]
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
            { code: 'HD01', name: '疏浚区1', subTaskTypes: ['water', 'sediment'] },
            { code: 'HD02', name: '疏浚区2', subTaskTypes: ['sediment'] }
          ]
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
            { code: 'B01', name: '生物监测点1', subTaskTypes: ['water', 'biology'] },
            { code: 'B02', name: '生物监测点2', subTaskTypes: ['biology'] },
            { code: 'B03', name: '生物监测点3', subTaskTypes: ['water', 'sediment', 'biology'] },
            { code: 'B04', name: '生物监测点4', subTaskTypes: ['biology'] }
          ]
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

    // 为 task_001 创建子任务和执行记录（模拟已进行中）
    createSubTasksForTask(mockTasks[0])
    generateExecutionsForTask(mockTasks[0])

    // 模拟部分执行记录已完成
    const task001Executions = executions.value.filter(e => e.taskId === 'task_001')
    task001Executions.forEach((exec, idx) => {
      if (idx === 0) {
        exec.status = ExecutionStatus.COMPLETED
        exec.dataValue = '已完成数据填写'
      }
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

  // 获取任务的所有执行记录
  function getExecutionsByTaskId(taskId) {
    return executions.value.filter(e => e.taskId === taskId)
  }

  // 获取子任务进度（已完成站点数 / 应执行站点数）
  function getSubTaskProgress(taskId, subTaskType) {
    const taskExecutions = getExecutionsByTaskIdAndType(taskId, subTaskType)
    if (taskExecutions.length === 0) return 0

    const completedCount = taskExecutions.filter(e => e.status === ExecutionStatus.COMPLETED).length
    return Math.round((completedCount / taskExecutions.length) * 100)
  }

  // 获取任务总进度（3个子任务进度的平均值）
  function getTaskProgress(taskId) {
    const taskSubTasks = getSubTasksByTaskId(taskId)
    if (taskSubTasks.length === 0) return 0

    const totalProgress = taskSubTasks.reduce((sum, st) => sum + getSubTaskProgress(taskId, st.type), 0)
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

  // 获取子任务的指标配置
  function getSubTaskIndicators(subTaskType) {
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
    getSubTaskProgress,
    getTaskProgress,
    completeExecution,
    getSubTaskIndicators
  }
})