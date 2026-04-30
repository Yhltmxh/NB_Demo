<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { ExecutionStatusName } from '../types'
import { ElMessage } from 'element-plus'
import { useTemplateStore } from '../stores/template'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const templateStore = useTemplateStore()

const taskId = computed(() => route.params.taskId)
const subTaskType = computed(() => route.params.subTaskType)
const stationCode = computed(() => route.params.stationCode)

const task = computed(() => taskStore.getTaskById(taskId.value))

// 获取子任务显示名称
const subTaskName = computed(() => {
  const tpl = templateStore.getTemplateById(subTaskType.value)
  if (tpl) return tpl.name
  const byCode = templateStore.getTemplateByCode(subTaskType.value)
  if (byCode) return byCode.name
  return subTaskType.value
})

// 获取该站点该子任务的执行记录
const execution = computed(() => {
  return taskStore.executions.find(
    e => e.taskId === taskId.value &&
        (e.templateId === subTaskType.value || e.subTaskType === subTaskType.value) &&
        e.stationCode === stationCode.value
  )
})

// 获取子任务指标（从模板动态加载）
const indicators = computed(() => taskStore.getSubTaskIndicators(subTaskType.value))

// 表单数据（每个指标一个输入框）
const formData = ref({
  values: {}
})

// 判断是否已完成
const isCompleted = computed(() => execution.value?.status === 'completed')

// 将数据值字符串解析为表格数据
const parsedData = computed(() => {
  if (!execution.value?.dataValue) return []
  return execution.value.dataValue.split(';').map((item, index) => {
    const trimmed = item.trim()
    const colonIndex = trimmed.indexOf(':')
    const name = colonIndex > -1 ? trimmed.substring(0, colonIndex).trim() : ''
    const value = colonIndex > -1 ? trimmed.substring(colonIndex + 1).trim() : trimmed
    // 从指标配置中获取单位
    const ind = indicators.value[index]
    const unit = ind ? ind.unit : ''
    return { name, value, unit }
  }).filter(d => d.name || d.value)
})

// 返回子任务详情
function goBack() {
  router.push(`/tasks/${taskId.value}/subtask/${subTaskType.value}`)
}

// 提交数据
function handleSubmit() {
  if (!execution.value) {
    ElMessage.error('执行记录不存在')
    return
  }

  // 将表单值拼接成字符串
  const dataValue = indicators.value.map(ind => {
    const val = formData.value.values[ind.id] || ''
    return `${ind.name}: ${val}`
  }).join('; ')

  const result = taskStore.completeExecution(execution.value.id, dataValue)

  if (result.success) {
    ElMessage.success('数据提交成功')
    router.push(`/tasks/${taskId.value}/subtask/${subTaskType.value}`)
  } else {
    ElMessage.error(result.message)
  }
}
</script>

<template>
  <div class="data-fill" v-if="task">
    <!-- 头部信息 -->
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span>{{ task.name }}</span>
          <el-button size="small" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="站位编号">
          {{ stationCode }}
        </el-descriptions-item>
        <el-descriptions-item label="子任务类型">
          {{ subTaskName }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="isCompleted ? 'success' : 'info'">
            {{ execution ? ExecutionStatusName[execution.status] : '-' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 已完成数据展示 -->
    <el-card v-if="isCompleted" class="completed-card">
      <template #header>
        <span>已提交数据</span>
      </template>
      <el-table :data="parsedData" border stripe size="small" :header-cell-style="{ fontWeight: '600', fontSize: '15px' }">
        <el-table-column prop="name" label="指标名称" width="200">
          <template #default="{ row }">
            <span class="indicator-name-text">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="检测值">
          <template #default="{ row }">
            <span class="data-value-text">{{ row.value || '-' }} <span v-if="row.unit" class="data-unit">{{ row.unit }}</span></span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 数据填写表单 -->
    <el-card v-else class="form-card">
      <template #header>
        <span>数据填写</span>
      </template>

      <el-form label-width="120px">
        <el-form-item
          v-for="ind in indicators"
          :key="ind.id"
          :label="ind.name"
        >
          <el-input
            v-model="formData.values[ind.id]"
            :placeholder="`请输入${ind.name}`"
            style="width: 300px"
          >
            <template #append v-if="ind.unit">
              {{ ind.unit }}
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            提交数据
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>

  <el-empty v-else description="任务不存在" />
</template>

<style scoped>
.data-fill {
  max-width: 800px;
  margin: 0 auto;
}

.form-card :deep(.el-form) {
  width: 500px;
  margin: 0 auto;
}

.header-card,
.completed-card,
.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.indicator-name-text {
  font-size: 15px;
  color: #303133;
}

.data-value-text {
  font-size: 15px;
  color: #303133;
}

.data-unit {
  font-size: 13px;
  color: #909399;
  margin-left: 4px;
}
</style>