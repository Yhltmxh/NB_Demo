<script setup>
import { ref, computed } from 'vue'
import { FrequencyName, DepthTypeName } from '../types'

const props = defineProps({
  // 可以传入预填的数据
})

const emit = defineEmits(['result'])

// 对话框状态
const dialogVisible = ref(false)
const currentTask = ref(null)
const currentAction = ref('') // 'approve' 或 'reject'
const comment = ref('')

// 是否为驳回模式
const isReject = computed(() => currentAction.value === 'reject')

// 打开对话框
function open(task, action) {
  currentTask.value = task
  currentAction.value = action
  comment.value = ''
  dialogVisible.value = true
}

// 深度配置显示
const depthDisplay = computed(() => {
  if (!currentTask.value) return ''
  const { depths } = currentTask.value.monitoringConfig
  if (depths.type === 'custom') {
    return depths.customDepths.join(', ') || '未设置'
  }
  return DepthTypeName[depths.type] || depths.type
})

// 确认
function handleConfirm() {
  if (isReject.value && !comment.value.trim()) {
    ElMessage.warning('驳回时必须填写意见')
    return
  }

  emit('result', {
    action: currentAction.value,
    taskId: currentTask.value.id,
    comment: comment.value
  })

  dialogVisible.value = false
}

// 取消
function handleCancel() {
  dialogVisible.value = false
}

// 暴露 open 方法
defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isReject ? '驳回任务' : '审核任务'"
    width="600px"
    :close-on-click-modal="false"
  >
    <div v-if="currentTask" class="approval-content">
      <!-- 任务信息 -->
      <el-card shadow="never" class="task-info-card">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="任务编号">
            {{ currentTask.taskCode }}
          </el-descriptions-item>
          <el-descriptions-item label="任务名称" :span="2">
            {{ currentTask.name }}
          </el-descriptions-item>
          <el-descriptions-item label="监测频次">
            {{ FrequencyName[currentTask.frequency] }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ currentTask.creator }}
          </el-descriptions-item>
          <el-descriptions-item label="时间范围" :span="2">
            {{ currentTask.startTime }} ~ {{ currentTask.endTime }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 监测配置 -->
      <div class="config-section">
        <h4 class="section-title">监测配置</h4>

        <div class="config-item">
          <span class="config-label">站位 ({{ currentTask.monitoringConfig.stations.length }}个):</span>
          <el-tag
            v-for="station in currentTask.monitoringConfig.stations"
            :key="station.code"
            size="small"
            style="margin-right: 4px; margin-bottom: 2px"
          >
            {{ station.code }}
          </el-tag>
        </div>

        <div class="config-item">
          <span class="config-label">指标 ({{ currentTask.monitoringConfig.indicators.length }}个):</span>
          <el-tag
            v-for="ind in currentTask.monitoringConfig.indicators"
            :key="ind.id"
            size="small"
            style="margin-right: 4px; margin-bottom: 2px"
          >
            {{ ind.name }}
          </el-tag>
        </div>

        <div class="config-item">
          <span class="config-label">深度:</span>
          <el-tag type="primary" size="small">{{ depthDisplay }}</el-tag>
        </div>
      </div>

      <!-- 审核意见 -->
      <div class="comment-section">
        <el-form>
          <el-form-item :label="isReject ? '驳回意见 (必填)' : '审核意见 (可选)'">
            <el-input
              v-model="comment"
              type="textarea"
              :rows="3"
              :placeholder="isReject ? '请输入驳回原因' : '请输入审核意见 (可选)'"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button :type="isReject ? 'warning' : 'success'" @click="handleConfirm">
          {{ isReject ? '确认驳回' : '确认通过' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.approval-content {
  max-height: 60vh;
  overflow-y: auto;
}

.task-info-card {
  margin-bottom: 20px;
}

.config-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}

.config-item {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.config-label {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
  min-width: 100px;
}

.comment-section {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
