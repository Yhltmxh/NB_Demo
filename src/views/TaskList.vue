<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { SubTaskType, SubTaskTypeName } from '../types'

const router = useRouter()
const taskStore = useTaskStore()

const searchKeyword = ref('')

const taskData = computed(() => {
  if (!taskStore.task) return null

  const validation = taskStore.validateTaskById(taskStore.task.id)

  return {
    ...taskStore.task,
    completionRate: validation.statistics.completionRate,
    subTaskCount: taskStore.subTasks.filter(st => st.taskId === taskStore.task.id).length,
    totalItems: validation.statistics.totalItems,
    filledItems: validation.statistics.filledItems,
    missingItems: validation.statistics.missingItems
  }
})

const subTaskStats = computed(() => {
  if (!taskStore.task) return []
  return taskStore.getSubTaskCompletionRates(taskStore.task.id)
})

function goToDataEntry(subTaskId) {
  router.push(`/data-entry/${subTaskId}`)
}

function goToProgress() {
  router.push('/progress')
}

function getStatusType(completionRate) {
  if (completionRate >= 100) return 'success'
  if (completionRate >= 50) return 'warning'
  return 'danger'
}

function getSubTaskIcon(type) {
  const icons = {
    [SubTaskType.DREDGED_MUD]: 'Box',
    [SubTaskType.WATER_QUALITY]: 'Water',
    [SubTaskType.SEDIMENT]: 'Document',
    [SubTaskType.BIOLOGY]: 'Operation',
    [SubTaskType.FISHERY]: 'Grid',
    [SubTaskType.ENVIRONMENT]: 'View'
  }
  return icons[type] || 'Folder'
}

function getStationCount(subTaskId) {
  const stations = taskStore.getStationsBySubTaskId(subTaskId)
  return stations.length
}

function resetMockData() {
  taskStore.resetData()
}
</script>

<template>
  <div class="task-list">
    <!-- 任务概览 -->
    <el-card class="task-overview" v-if="taskData">
      <div class="task-header">
        <div class="task-info">
          <h2 class="task-name">{{ taskData.name }}</h2>
          <div class="task-meta">
            <el-tag size="small" type="info">{{ taskData.taskCode }}</el-tag>
            <span class="task-time">
              <el-icon><Calendar /></el-icon>
              {{ taskData.startTime }} ~ {{ taskData.endTime }}
            </span>
          </div>
        </div>
        <div class="task-actions">
          <el-button type="primary" @click="goToProgress">
            <el-icon><DataAnalysis /></el-icon>
            查看进度统计
          </el-button>
          <el-button @click="resetMockData">
            <el-icon><Refresh /></el-icon>
            重置数据
          </el-button>
        </div>
      </div>

      <div class="task-stats">
        <div class="stat-item">
          <div class="stat-value">{{ taskData.completionRate }}%</div>
          <div class="stat-label">总体完成率</div>
          <el-progress
            :percentage="taskData.completionRate"
            :status="getStatusType(taskData.completionRate)"
            :stroke-width="8"
          />
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ taskData.filledItems }}</div>
          <div class="stat-label">已录入</div>
        </div>
        <div class="stat-item">
          <div class="stat-value status-danger">{{ taskData.missingItems }}</div>
          <div class="stat-label">缺失</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ taskData.totalItems }}</div>
          <div class="stat-label">应录入总数</div>
        </div>
      </div>
    </el-card>

    <!-- 子任务列表 -->
    <div class="subtask-section">
      <h3 class="section-title">子任务列表</h3>
      <div class="subtask-grid">
        <el-card
          v-for="stat in subTaskStats"
          :key="stat.subTaskId"
          class="subtask-card"
          shadow="hover"
        >
          <div class="subtask-header">
            <div class="subtask-icon">
              <el-icon size="24"><component :is="getSubTaskIcon(stat.subTaskType)" /></el-icon>
            </div>
            <div class="subtask-info">
              <div class="subtask-name">{{ taskStore.getSubTaskTypeName(stat.subTaskType) }}</div>
              <div class="subtask-stations">{{ getStationCount(stat.subTaskId) }} 个站位</div>
            </div>
          </div>

          <div class="subtask-progress">
            <div class="progress-info">
              <span>完成率</span>
              <span class="progress-value">{{ stat.completionRate }}%</span>
            </div>
            <el-progress
              :percentage="stat.completionRate"
              :status="getStatusType(stat.completionRate)"
              :stroke-width="6"
            />
          </div>

          <div class="subtask-stats-row">
            <span class="stat">
              <el-tag type="success" size="small">{{ stat.filledItems }} 已填</el-tag>
            </span>
            <span class="stat">
              <el-tag type="danger" size="small">{{ stat.missingItems }} 缺失</el-tag>
            </span>
          </div>

          <div class="subtask-actions">
            <el-button type="primary" size="small" @click="goToDataEntry(stat.subTaskId)">
              <el-icon><Edit /></el-icon>
              数据录入
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 任务树形结构 -->
    <el-card class="tree-card">
      <template #header>
        <div class="card-header">
          <span>任务结构</span>
        </div>
      </template>
      <el-tree
        v-if="taskData"
        :data="[taskStore.getTaskTree(taskData.id)]"
        :props="{ children: 'children', label: 'label' }"
        default-expand-all
      >
        <template #default="{ data }">
          <span class="tree-node">
            <el-icon v-if="data.type === 'task'"><FolderOpened /></el-icon>
            <el-icon v-else-if="data.type === 'subTask'"><Collection /></el-icon>
            <el-icon v-else><Location /></el-icon>
            <span>{{ data.label }}</span>
          </span>
        </template>
      </el-tree>
    </el-card>
  </div>
</template>

<style scoped>
.task-list {
  max-width: 1400px;
  margin: 0 auto;
}

.task-overview {
  margin-bottom: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.task-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
}

.task-actions {
  display: flex;
  gap: 10px;
}

.task-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.subtask-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.subtask-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.subtask-card {
  transition: all 0.3s;
}

.subtask-card:hover {
  transform: translateY(-2px);
}

.subtask-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.subtask-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.subtask-info {
  flex: 1;
}

.subtask-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.subtask-stations {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.subtask-progress {
  margin-bottom: 15px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.progress-value {
  font-weight: 600;
  color: #409eff;
}

.subtask-stats-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.subtask-actions {
  display: flex;
  justify-content: flex-end;
}

.tree-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
