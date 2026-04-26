<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { SubTaskTypeName, ExecutionStatusName } from '../types'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const taskId = computed(() => route.params.taskId)
const subTaskType = computed(() => route.params.subTaskType)

const task = computed(() => taskStore.getTaskById(taskId.value))
const executions = computed(() => taskStore.getExecutionsByTaskIdAndType(taskId.value, subTaskType.value))
const subTaskProgress = computed(() => taskStore.getSubTaskProgress(taskId.value, subTaskType.value))

// 获取子任务指标
const indicators = computed(() => taskStore.getSubTaskIndicators(subTaskType.value))

// 返回任务详情
function goBack() {
  router.push(`/tasks/${taskId.value}`)
}

// 跳转数据填写页
function goToDataFill(stationCode) {
  router.push(`/tasks/${taskId.value}/subtask/${subTaskType.value}/station/${stationCode}`)
}

// 获取执行状态类型
function getStatusType(status) {
  return status === 'completed' ? 'success' : 'info'
}
</script>

<template>
  <div class="subtask-detail" v-if="task">
    <!-- 头部信息 -->
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span>{{ task.name }} - {{ SubTaskTypeName[subTaskType] }}</span>
          <el-button size="small" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回任务详情
          </el-button>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="任务编号">
          {{ task.taskCode }}
        </el-descriptions-item>
        <el-descriptions-item label="子任务类型">
          {{ SubTaskTypeName[subTaskType] }}
        </el-descriptions-item>
        <el-descriptions-item label="子任务进度">
          <el-progress
            :percentage="subTaskProgress"
            :status="subTaskProgress >= 100 ? 'success' : 'warning'"
            :stroke-width="10"
            style="width: 200px"
          />
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 站点执行情况 -->
    <el-card class="stations-card">
      <template #header>
        <div class="card-header">
          <span>站点执行情况</span>
          <span class="hint-text">点击站点进入数据填写</span>
        </div>
      </template>

      <el-table :data="executions" border stripe>
        <el-table-column prop="stationCode" label="站位编号" width="120">
          <template #default="{ row }">
            <span class="station-code">{{ row.stationCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stationName" label="站位名称" width="150" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ ExecutionStatusName[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataValue" label="数据值" min-width="200">
          <template #default="{ row }">
            <span v-if="row.dataValue">{{ row.dataValue }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              :type="row.status === 'completed' ? 'success' : 'primary'"
              size="small"
              @click="goToDataFill(row.stationCode)"
            >
              {{ row.status === 'completed' ? '查看' : '填写数据' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 子任务指标说明 -->
    <el-card class="indicators-card">
      <template #header>
        <span>子任务指标</span>
      </template>

      <div class="indicators-list">
        <el-tag
          v-for="ind in indicators"
          :key="ind.id"
          size="small"
          style="margin-right: 8px; margin-bottom: 4px"
        >
          {{ ind.name }}
          <span v-if="ind.unit" style="color: #909399">({{ ind.unit }})</span>
        </el-tag>
      </div>
    </el-card>
  </div>

  <el-empty v-else description="任务不存在" />
</template>

<style scoped>
.subtask-detail {
  max-width: 1000px;
  margin: 0 auto;
}

.header-card,
.stations-card,
.indicators-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint-text {
  font-size: 12px;
  color: #909399;
}

.station-code {
  font-weight: 600;
  color: #409eff;
}

.no-data {
  color: #c0c4cc;
}

.stations-card .el-button {
  font-size: 14px;
}

.indicators-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>