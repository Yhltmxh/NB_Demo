<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { SubTaskType } from '../types'

const router = useRouter()
const taskStore = useTaskStore()

const activeTab = ref('overview')

// 任务数据
const taskData = computed(() => {
  if (!taskStore.task) return null
  const validation = taskStore.validateTaskById(taskStore.task.id)
  return {
    ...taskStore.task,
    ...validation.statistics
  }
})

// 子任务完成率列表
const subTaskStats = computed(() => {
  if (!taskStore.task) return []
  return taskStore.getSubTaskCompletionRates(taskStore.task.id)
})

// 按站位统计缺失项
const missingByStation = computed(() => {
  if (!taskStore.task) return []
  return taskStore.getMissingByStation(taskStore.task.id)
})

// 按指标统计缺失项
const missingByIndicator = computed(() => {
  if (!taskStore.task) return []
  return taskStore.getMissingByIndicator(taskStore.task.id)
})

// 获取子任务名称
function getSubTaskName(type) {
  return taskStore.getSubTaskTypeName(type)
}

// 获取完成率状态类型
function getProgressStatus(rate) {
  if (rate >= 100) return 'success'
  if (rate >= 50) return 'warning'
  return 'exception'
}

// 获取颜色
function getColor(rate) {
  if (rate >= 100) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

// 去数据录入
function goToDataEntry(subTaskId) {
  router.push(`/data-entry/${subTaskId}`)
}

// 缺失项表格列
const stationTableColumns = [
  { prop: 'stationCode', label: '站位', width: '100' },
  { prop: 'layer', label: '层次', width: '100' },
  { prop: 'subTaskName', label: '子任务', width: '120' },
  { prop: 'missingIndicators', label: '缺失指标', minWidth: '200' }
]

const indicatorTableColumns = [
  { prop: 'indicatorName', label: '指标名称', width: '150' },
  { prop: 'subTaskName', label: '子任务', width: '120' },
  { prop: 'count', label: '缺失数量', width: '100' },
  { prop: 'stations', label: '涉及站位', minWidth: '200' }
]

// 获取状态图标的类型
function getStatusIconType(type) {
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
</script>

<template>
  <div class="progress-view">
    <!-- 总览 -->
    <el-card class="overview-card" v-if="taskData">
      <div class="overview-header">
        <h2 class="overview-title">任务完成情况总览</h2>
      </div>

      <div class="overview-content">
        <div class="main-progress">
          <el-progress
            type="circle"
            :percentage="taskData.completionRate"
            :status="getProgressStatus(taskData.completionRate)"
            :stroke-width="12"
            :width="160"
          >
            <template #default>
              <div class="circle-content">
                <span class="rate-value">{{ taskData.completionRate }}%</span>
                <span class="rate-label">完成率</span>
              </div>
            </template>
          </el-progress>

          <div class="main-stats">
            <div class="stat-row">
              <span class="stat-label">已录入</span>
              <span class="stat-value success">{{ taskData.filledItems }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">缺失</span>
              <span class="stat-value danger">{{ taskData.missingItems }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">总计</span>
              <span class="stat-value">{{ taskData.totalItems }}</span>
            </div>
          </div>
        </div>

        <div class="task-info">
          <h3>{{ taskData.name }}</h3>
          <p class="task-code">
            <el-tag size="small" type="info">{{ taskData.taskCode }}</el-tag>
          </p>
          <p class="task-time">
            <el-icon><Calendar /></el-icon>
            {{ taskData.startTime }} ~ {{ taskData.endTime }}
          </p>
        </div>
      </div>
    </el-card>

    <!-- 子任务进度 -->
    <el-card class="subtask-card">
      <template #header>
        <div class="card-header">
          <span>各子任务进度</span>
        </div>
      </template>

      <div class="subtask-list">
        <div
          v-for="stat in subTaskStats"
          :key="stat.subTaskId"
          class="subtask-item"
        >
          <div class="subtask-icon">
            <el-icon size="20"><component :is="getStatusIconType(stat.subTaskType)" /></el-icon>
          </div>
          <div class="subtask-info">
            <div class="subtask-name">{{ getSubTaskName(stat.subTaskType) }}</div>
            <div class="subtask-meta">
              <span>已填: {{ stat.filledItems }}</span>
              <span class="separator">|</span>
              <span class="danger">缺失: {{ stat.missingItems }}</span>
            </div>
          </div>
          <div class="subtask-progress">
            <el-progress
              :percentage="stat.completionRate"
              :status="getProgressStatus(stat.completionRate)"
              :stroke-width="8"
              style="width: 200px"
            />
          </div>
          <div class="subtask-action">
            <el-button size="small" @click="goToDataEntry(stat.subTaskId)">
              <el-icon><Edit /></el-icon>
              录入
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 缺失项分析 -->
    <el-tabs v-model="activeTab" class="analysis-tabs">
      <!-- 按站位统计 -->
      <el-tab-pane label="按站位统计" name="byStation">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>缺失项 - 按站位</span>
              <el-tag type="danger" size="small">{{ missingByStation.length }} 个站位有缺失</el-tag>
            </div>
          </template>

          <el-table
            v-if="missingByStation.length > 0"
            :data="missingByStation"
            border
            stripe
            :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
          >
            <el-table-column
              v-for="col in stationTableColumns"
              :key="col.prop"
              :prop="col.prop"
              :label="col.label"
              :width="col.width"
              :min-width="col.minWidth"
            >
              <template #default="{ row }">
                <span v-if="col.prop === 'stationCode'" class="station-code">
                  {{ row.stationCode }}
                </span>
                <span v-else-if="col.prop === 'layer'" class="layer-info">
                  {{ row.layer || '表层' }}
                </span>
                <span v-else-if="col.prop === 'missingIndicators'" class="indicators-list">
                  <el-tag
                    v-for="ind in row.missingIndicators"
                    :key="ind"
                    size="small"
                    type="danger"
                    style="margin-right: 4px; margin-bottom: 2px"
                  >
                    {{ ind }}
                  </el-tag>
                </span>
                <span v-else>{{ row[col.prop] }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="所有数据均已填写" />
        </el-card>
      </el-tab-pane>

      <!-- 按指标统计 -->
      <el-tab-pane label="按指标统计" name="byIndicator">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>缺失项 - 按指标</span>
              <el-tag type="warning" size="small">{{ missingByIndicator.length }} 个指标有缺失</el-tag>
            </div>
          </template>

          <el-table
            v-if="missingByIndicator.length > 0"
            :data="missingByIndicator"
            border
            stripe
            :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
          >
            <el-table-column
              v-for="col in indicatorTableColumns"
              :key="col.prop"
              :prop="col.prop"
              :label="col.label"
              :width="col.width"
              :min-width="col.minWidth"
            >
              <template #default="{ row }">
                <span v-if="col.prop === 'count'" class="count-badge">
                  <el-badge :value="row.count" type="danger" />
                </span>
                <span v-else-if="col.prop === 'stations'" class="stations-list">
                  <el-tag
                    v-for="station in row.stations"
                    :key="station"
                    size="small"
                    style="margin-right: 4px; margin-bottom: 2px"
                  >
                    {{ station }}
                  </el-tag>
                </span>
                <span v-else>{{ row[col.prop] }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="所有指标均已填写" />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.progress-view {
  max-width: 1200px;
  margin: 0 auto;
}

.overview-card {
  margin-bottom: 20px;
}

.overview-header {
  margin-bottom: 20px;
}

.overview-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.overview-content {
  display: flex;
  align-items: center;
  gap: 60px;
}

.main-progress {
  display: flex;
  align-items: center;
  gap: 40px;
}

.circle-content {
  text-align: center;
}

.rate-value {
  display: block;
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.rate-label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.main-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  min-width: 50px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

.task-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
}

.task-code {
  margin-bottom: 8px;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #606266;
}

.subtask-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.subtask-item:hover {
  background: #ecf5ff;
}

.subtask-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.subtask-info {
  flex: 1;
}

.subtask-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.subtask-meta {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.subtask-meta .separator {
  margin: 0 8px;
}

.subtask-meta .danger {
  color: #f56c6c;
}

.subtask-action {
  min-width: 80px;
}

.analysis-tabs {
  margin-bottom: 20px;
}

.station-code {
  font-weight: 600;
  color: #409eff;
}

.layer-info {
  color: #606266;
}

.indicators-list,
.stations-list {
  display: flex;
  flex-wrap: wrap;
}

.count-badge {
  display: inline-flex;
}
</style>
