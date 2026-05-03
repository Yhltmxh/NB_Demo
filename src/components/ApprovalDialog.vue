<script setup>
import { ref, computed } from 'vue'
import { FrequencyName } from '../types'
import { useTemplateStore } from '../stores/template'

const props = defineProps({
})

const emit = defineEmits(['result'])

const templateStore = useTemplateStore()

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
  templateStore.initialize()
  comment.value = ''
  dialogVisible.value = true
}

// 站位配置显示
const stationDisplay = computed(() => {
  if (!currentTask.value) return []
  return currentTask.value.monitoringConfig?.stations || []
})

// 子任务配置显示 - 从实际站点中提取使用的模板
const subTaskTypesDisplay = computed(() => {
  const usedCodes = new Set()
  stationDisplay.value.forEach(s => (s.subTaskTypes || []).forEach(t => usedCodes.add(t)))
  return [...usedCodes].map(code => {
    const tpl = templateStore.getTemplateByCode(code)
    return {
      type: code,
      name: tpl ? tpl.name : code,
      stationCount: stationDisplay.value.filter(s => (s.subTaskTypes || []).includes(code)).length
    }
  })
})

function getTemplateName(code) {
  const tpl = templateStore.getTemplateByCode(code)
  return tpl ? tpl.name : code
}

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

      <!-- 站点配置 -->
      <div class="config-section">
        <h4 class="section-title">站点配置</h4>

        <el-table
          :data="stationDisplay"
          border
          size="small"
          style="margin-bottom: 15px"
          v-if="stationDisplay.length > 0"
        >
          <el-table-column prop="code" label="站位编号" width="120" />
          <el-table-column prop="name" label="站位名称" width="150" />
          <el-table-column label="子任务" min-width="200">
            <template #default="{ row }">
              <el-tag
                v-for="type in (row.subTaskTypes || [])"
                :key="type"
                size="small"
                style="margin-right: 4px"
              >
                {{ getTemplateName(type) }}
              </el-tag>
              <span v-if="!row.subTaskTypes?.length" class="no-data">未配置</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="no-data">暂无站点配置</div>
      </div>

      <!-- 子任务统计 -->
      <div class="config-section">
        <h4 class="section-title">子任务统计</h4>
        <div class="subtask-stats">
          <div
            v-for="item in subTaskTypesDisplay"
            :key="item.type"
            class="stat-item"
          >
            <el-tag size="small">{{ item.name }}</el-tag>
            <span class="stat-count">{{ item.stationCount }}个站点</span>
          </div>
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
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
}

.subtask-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.stat-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.comment-section {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.no-data {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>