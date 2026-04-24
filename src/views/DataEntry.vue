<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { RecordStatus, LayerTypeName } from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const currentPage = ref(1)
const pageSize = ref(50)
const filterStatus = ref('')

// 获取任务ID
const taskId = computed(() => route.params.taskId)

// 获取任务信息
const task = computed(() => {
  if (!taskId.value) return null
  return taskStore.getTaskById(taskId.value)
})

// 表格数据
const tableData = computed(() => {
  if (!taskId.value) return []
  let records = taskStore.getDataRecordsByTaskId(taskId.value)

  if (filterStatus.value) {
    records = records.filter(r => r.status === filterStatus.value)
  }

  return records
})

// 分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// 总记录数
const totalRecords = computed(() => tableData.value.length)

// 统计数据
const statistics = computed(() => {
  if (!taskId.value) return { total: 0, filled: 0, missing: 0, completionRate: 0 }
  return taskStore.getDataStatistics(taskId.value)
})

// 输入值变化
function handleInputChange(record, newValue) {
  taskStore.updateDataRecord(taskId.value, record.id, newValue)
}

// 获取状态标签类型
function getStatusType(status) {
  return status === RecordStatus.FILLED ? 'success' : 'danger'
}

// 获取状态文本
function getStatusText(status) {
  return status === RecordStatus.FILLED ? '已填' : '缺失'
}

// 获取层次显示
function getLayerDisplay(layer) {
  return LayerTypeName[layer] || layer || '表层'
}

// 返回任务详情
function goBack() {
  router.push(`/tasks/${taskId.value}`)
}

// 返回任务列表
function goToTasks() {
  router.push('/tasks')
}
</script>

<template>
  <div class="data-entry">
    <!-- 任务信息 -->
    <el-card class="task-info-card" v-if="task">
      <div class="task-info">
        <div class="task-title">
          <h2>{{ task.name }}</h2>
          <el-tag size="small" type="info">{{ task.taskCode }}</el-tag>
        </div>
        <div class="task-breadcrumb">
          <el-link @click="goToTasks">任务列表</el-link>
          <span class="separator">/</span>
          <el-link @click="goBack">{{ task.name }}</el-link>
          <span class="separator">/</span>
          <span>数据录入</span>
        </div>
      </div>
    </el-card>

    <!-- 工具栏 -->
    <el-card class="toolbar-card" v-if="task">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select
            v-model="filterStatus"
            placeholder="筛选状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="已填写" :value="RecordStatus.FILLED" />
            <el-option label="缺失" :value="RecordStatus.MISSING" />
          </el-select>

          <span class="stats-info">
            共 {{ statistics.total}} 项 |
            <span class="success">已填 {{ statistics.filled }}</span> |
            <span class="danger">缺失 {{ statistics.missing }}</span>
          </span>
        </div>

        <div class="toolbar-right">
          <div class="completion-info">
            <span class="label">完成率：</span>
            <el-progress
              :percentage="statistics.completionRate"
              :status="statistics.completionRate >= 100 ? 'success' : statistics.completionRate >= 50 ? 'warning' : 'exception'"
              style="width: 150px"
            />
          </div>

          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" v-if="task">
      <el-table
        :data="paginatedData"
        border
        stripe
        style="width: 100%"
        max-height="600"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
      >
        <el-table-column prop="stationCode" label="站位" width="100" fixed>
          <template #default="{ row }">
            <span class="station-cell">{{ row.stationCode }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="stationName" label="站位名称" width="120">
          <template #default="{ row }">
            <span class="station-name">{{ row.stationName }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="layer" label="层次" width="100">
          <template #default="{ row }">
            <span class="layer-cell">{{ getLayerDisplay(row.layer) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="indicatorName" label="指标" min-width="150">
          <template #default="{ row }">
            <span>{{ row.indicatorName }}</span>
            <span v-if="row.indicatorUnit" class="indicator-unit">({{ row.indicatorUnit }})</span>
          </template>
        </el-table-column>

        <el-table-column prop="value" label="测定值" min-width="150">
          <template #default="{ row }">
            <el-input
              v-model="row.value"
              :placeholder="row.indicatorUnit || '请输入'"
              @input="handleInputChange(row, $event)"
              clearable
            />
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalRecords"
          layout="total, prev, pager, next"
          background
        />
      </div>
    </el-card>

    <!-- 无任务提示 -->
    <el-empty v-else description="请先选择一个任务" />

    <!-- 缺失项提示 -->
    <el-card class="missing-card" v-if="task && statistics.missing > 0">
      <template #header>
        <div class="card-header">
          <span>缺失项统计</span>
        </div>
      </template>
      <el-table
        :data="taskStore.getMissingByStation(taskId)"
        border
        stripe
      >
        <el-table-column prop="stationCode" label="站位" width="120" />
        <el-table-column prop="layer" label="层次" width="100">
          <template #default="{ row }">
            {{ getLayerDisplay(row.layer) }}
          </template>
        </el-table-column>
        <el-table-column prop="indicators" label="缺失指标" min-width="300">
          <template #default="{ row }">
            <el-tag
              v-for="ind in row.indicators"
              :key="ind.name"
              type="danger"
              size="small"
              style="margin-right: 4px; margin-bottom: 2px"
            >
              {{ ind.name }}
              <span v-if="ind.unit">({{ ind.unit }})</span>
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.data-entry {
  max-width: 1200px;
  margin: 0 auto;
}

.task-info-card {
  margin-bottom: 20px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.task-title h2 {
  margin: 0;
  font-size: 18px;
}

.task-breadcrumb {
  margin-top: 10px;
  font-size: 14px;
}

.task-breadcrumb .separator {
  margin: 0 8px;
  color: #909399;
}

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stats-info {
  font-size: 14px;
  color: #606266;
}

.stats-info .success {
  color: #67c23a;
}

.stats-info .danger {
  color: #f56c6c;
}

.completion-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.completion-info .label {
  font-size: 14px;
  color: #606266;
}

.table-card {
  margin-bottom: 20px;
}

.station-cell {
  font-weight: 600;
  color: #409eff;
}

.station-name {
  color: #606266;
}

.layer-cell {
  color: #909399;
}

.indicator-unit {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.missing-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
}
</style>
