<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { RecordStatus, SubTaskType, LayerType } from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const selectedSubTaskId = ref('')
const currentPage = ref(1)
const pageSize = ref(100)
const filterStatus = ref('')

// 子任务列表
const subTaskOptions = computed(() => {
  if (!taskStore.task) return []
  const subTasks = taskStore.getSubTasksByTaskId(taskStore.task.id)
  return subTasks.map(st => ({
    value: st.id,
    label: taskStore.getSubTaskTypeName(st.type),
    type: st.type
  }))
})

// 监听路由参数
watch(() => route.params.subTaskId, (newVal) => {
  if (newVal) {
    selectedSubTaskId.value = newVal
  } else if (subTaskOptions.value.length > 0 && !selectedSubTaskId.value) {
    selectedSubTaskId.value = subTaskOptions.value[0].value
  }
}, { immediate: true })

// 站位列表
const stationOptions = computed(() => {
  if (!selectedSubTaskId.value) return []
  const stations = taskStore.getStationsBySubTaskId(selectedSubTaskId.value)
  return stations.map(s => ({
    value: s.id,
    label: s.stationCode,
    ...s
  }))
})

// 当前子任务类型
const currentSubTaskType = computed(() => {
  const subTask = taskStore.subTasks.find(st => st.id === selectedSubTaskId.value)
  return subTask?.type || null
})

// 表格数据
const tableData = computed(() => {
  if (!selectedSubTaskId.value) return []

  let records = taskStore.getDataRecordsBySubTaskId(selectedSubTaskId.value)

  // 过滤状态
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

// 完成率
const completionRate = computed(() => {
  if (!selectedSubTaskId.value) return 0
  const stats = taskStore.getSubTaskCompletionRates(taskStore.task?.id)
    .find(s => s.subTaskId === selectedSubTaskId.value)
  return stats?.completionRate || 0
})

// 缺失数
const missingCount = computed(() => {
  if (!selectedSubTaskId.value) return 0
  const stats = taskStore.getSubTaskCompletionRates(taskStore.task?.id)
    .find(s => s.subTaskId === selectedSubTaskId.value)
  return stats?.missingItems || 0
})

// 输入值变化
function handleInputChange(record, newValue) {
  taskStore.updateDataRecord(selectedSubTaskId.value, record.id, newValue)
}

// 批量保存（手动触发）
function saveAllData() {
  taskStore.saveData()
  ElMessage.success('数据已保存')
}

// 跳转到进度页面
function goToProgress() {
  router.push('/progress')
}

// 获取层次显示
function getLayerDisplay(layer) {
  if (layer === LayerType.SURFACE) return '表层'
  if (layer === LayerType.BOTTOM) return '底层'
  return layer
}

// 判断是否是特殊站位（柱状样或深水站位）
function isSpecialStation(record) {
  const stations = taskStore.getStationsBySubTaskId(selectedSubTaskId.value)
  const station = stations.find(s => s.id === record.stationId)
  if (!station) return false

  // 疏浚泥柱状样站位
  if (currentSubTaskType.value === SubTaskType.DREDGED_MUD) {
    return ['HD1', 'HD8', 'HD14'].includes(station.stationCode)
  }

  // 水质深水站位
  if (currentSubTaskType.value === SubTaskType.WATER_QUALITY) {
    return station.depth > 10
  }

  return false
}

// 获取状态标签类型
function getStatusType(status) {
  return status === RecordStatus.FILLED ? 'success' : 'danger'
}

// 获取状态文本
function getStatusText(status) {
  return status === RecordStatus.FILLED ? '已填' : '缺失'
}

// 选择子任务
function onSubTaskChange(value) {
  selectedSubTaskId.value = value
  currentPage.value = 1
}
</script>

<template>
  <div class="data-entry">
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select
            v-model="selectedSubTaskId"
            placeholder="选择子任务"
            style="width: 200px"
            @change="onSubTaskChange"
          >
            <el-option
              v-for="option in subTaskOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-select
            v-model="filterStatus"
            placeholder="筛选状态"
            clearable
            style="width: 120px; margin-left: 10px"
          >
            <el-option label="全部" value="" />
            <el-option label="已填写" :value="RecordStatus.FILLED" />
            <el-option label="缺失" :value="RecordStatus.MISSING" />
          </el-select>

          <el-button style="margin-left: 10px" @click="saveAllData">
            <el-icon><FolderChecked /></el-icon>
            保存数据
          </el-button>
        </div>

        <div class="toolbar-right">
          <div class="completion-info">
            <span class="label">完成率：</span>
            <el-progress
              :percentage="completionRate"
              :status="completionRate >= 100 ? 'success' : completionRate >= 50 ? 'warning' : 'exception'"
              style="width: 150px"
            />
            <span class="missing-count" v-if="missingCount > 0">
              <el-tag type="danger" size="small">{{ missingCount }} 项缺失</el-tag>
            </span>
          </div>

          <el-button type="primary" @click="goToProgress">
            <el-icon><DataAnalysis /></el-icon>
            进度统计
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" v-if="selectedSubTaskId">
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

        <el-table-column prop="layer" label="层次" width="100">
          <template #default="{ row }">
            <span :class="['layer-cell', { 'is-special': isSpecialStation(row) }]">
              {{ getLayerDisplay(row.layer) }}
            </span>
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

    <!-- 无数据提示 -->
    <el-empty v-else description="请选择子任务类型" />
  </div>
</template>

<style scoped>
.data-entry {
  max-width: 1400px;
  margin: 0 auto;
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
  gap: 10px;
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

.missing-count {
  margin-left: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.station-cell {
  font-weight: 600;
  color: #409eff;
}

.layer-cell {
  color: #606266;
}

.layer-cell.is-special {
  color: #e6a23c;
  font-weight: 500;
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
</style>
