<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { SubTaskTypeName, ExecutionStatusName } from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const taskId = computed(() => route.params.taskId)
const subTaskType = computed(() => route.params.subTaskType)
const stationCode = computed(() => route.params.stationCode)

const task = computed(() => taskStore.getTaskById(taskId.value))

// 获取该站点该子任务的执行记录
const execution = computed(() => {
  return taskStore.executions.find(
    e => e.taskId === taskId.value && e.subTaskType === subTaskType.value && e.stationCode === stationCode.value
  )
})

// 获取子任务指标
const indicators = computed(() => taskStore.getSubTaskIndicators(subTaskType.value))

// 表单数据（每个指标一个输入框）
const formData = ref({
  values: {}
})

// 判断是否已完成
const isCompleted = computed(() => execution.value?.status === 'completed')

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
          {{ SubTaskTypeName[subTaskType] }}
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
      <div class="completed-data">
        {{ execution.dataValue }}
      </div>
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

.completed-data {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
}
</style>