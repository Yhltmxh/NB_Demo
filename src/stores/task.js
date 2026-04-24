/**
 * 任务管理 Store
 * 包含任务 CRUD 和审批流转逻辑
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '../utils/storage'
import {
  TaskStatus,
  FlowAction,
  StatusFlow
} from '../types'

const STORAGE_KEY = 'task_data'
const TASK_FLOW_KEY = 'task_flow'

// 生成ID
const generateId = () => Math.random().toString(36).substring(2, 15)

// 获取当前时间
const getCurrentTime = () => new Date().toLocaleString('zh-CN')

export const useTaskStore = defineStore('task', () => {
  // 状态
  const tasks = ref([])
  const taskFlows = ref({}) // { taskId: TaskFlow[] }

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

    if (savedTasks && savedTasks.length > 0) {
      tasks.value = savedTasks
    } else {
      // 加载初始 Mock 数据
      loadMockData()
    }

    if (savedFlows) {
      taskFlows.value = savedFlows
    }

    isInitialized.value = true
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
          depths: {
            type: 'surface_bottom',
            customDepths: []
          }
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
          depths: {
            type: 'surface',
            customDepths: []
          }
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
          depths: {
            type: 'surface',
            customDepths: []
          }
        }
      }
    ]

    tasks.value = mockTasks

    // 初始化流转记录
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
    saveData()
  }

  // 保存数据到 localStorage
  function saveData() {
    storage.set(STORAGE_KEY, tasks.value)
    storage.set(TASK_FLOW_KEY, taskFlows.value)
  }

  // 重置数据
  function resetData() {
    storage.remove(STORAGE_KEY)
    storage.remove(TASK_FLOW_KEY)
    tasks.value = []
    taskFlows.value = {}
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

    // 记录流转
    addFlow(newTask.id, FlowAction.CREATE, newTask.creator, '创建任务')

    saveData()
    return newTask
  }

  // 更新任务
  function updateTask(taskId, taskData) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      // 只有草稿或驳回状态才能编辑
      const task = tasks.value[index]
      if (task.status !== TaskStatus.DRAFT && task.status !== TaskStatus.REJECTED) {
        return { success: false, message: '当前状态不允许编辑' }
      }

      tasks.value[index] = {
        ...task,
        ...taskData,
        id: taskId // 保持ID不变
      }
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

  // 启动任务
  function startTask(taskId, operator = '管理员', comment = '') {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }

    if (task.status !== TaskStatus.APPROVED) {
      return { success: false, message: '只有已通过审核的任务才能启动' }
    }

    task.status = TaskStatus.RUNNING
    addFlow(taskId, FlowAction.START, operator, comment || '任务启动')

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

    // 删除关联的流转记录
    delete taskFlows.value[taskId]

    saveData()
    return { success: true, message: '删除成功' }
  }

  return {
    // 状态
    tasks,
    taskFlows,
    isInitialized,

    // 计算属性
    taskList,
    getTasksByStatus,
    getFlowsByTaskId,

    // 方法
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
    deleteTask
  }
})
