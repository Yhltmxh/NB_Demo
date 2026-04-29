<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { useTemplateStore } from '../stores/template'
import { TaskStatusName, ExecutionStatusName } from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const templateStore = useTemplateStore()

const taskId = computed(() => route.params.taskId)
const task = computed(() => taskStore.getTaskById(taskId.value))

const subTasks = computed(() => taskStore.getSubTasksByTaskId(taskId.value))

// 按模板分组展示执行记录
const groupedExecutions = computed(() => {
  const groups = []
  const taskSubTasks = subTasks.value
  const allExecutions = taskStore.getExecutionsByTaskId(taskId.value)

  taskSubTasks.forEach(subTask => {
    const tpl = templateStore.getTemplateById(subTask.templateId) || templateStore.getTemplateByCode(subTask.type)
    const tplName = tpl ? tpl.name : (subTask.templateName || subTask.type)
    const execs = allExecutions.filter(
      e => e.templateId === subTask.templateId || e.subTaskType === subTask.type
    )
    groups.push({
      subTaskId: subTask.id,
      templateName: tplName,
      type: subTask.type,
      executions: execs
    })
  })
  return groups
})

const verifyComment = ref('')

onMounted(() => {
  templateStore.initialize()
})

function goBack() {
  router.push(`/tasks/${taskId.value}`)
}

function handleApprove() {
  if (!verifyComment.value.trim()) {
    ElMessage.warning('请填写校验意见')
    return
  }

  const result = taskStore.approveVerification(taskId.value, '校验人', verifyComment.value)
  if (result.success) {
    ElMessage.success('校验通过')
    router.push(`/tasks/${taskId.value}`)
  } else {
    ElMessage.error(result.message)
  }
}

function handleReject() {
  if (!verifyComment.value.trim()) {
    ElMessage.warning('请填写校验意见')
    return
  }

  const result = taskStore.rejectVerification(taskId.value, '校验人', verifyComment.value)
  if (result.success) {
    ElMessage.success('已退回修改')
    router.push(`/tasks/${taskId.value}`)
  } else {
    ElMessage.error(result.message)
  }
}

function getExecutionStatusType(status) {
  return status === 'completed' ? 'success' : 'info'
}
</script>

<template>
  <div class="data-verify" v-if="task">
    <!-- 任务基本信息 -->
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <el-button size="small" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span>数据校验 - {{ task.name }}</span>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="任务编号">{{ task.taskCode }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag type="warning" size="small">{{ TaskStatusName[task.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ task.creator }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 按子任务类别展示数据 -->
    <el-card
      v-for="group in groupedExecutions"
      :key="group.subTaskId"
      class="verify-group-card"
    >
      <template #header>
        <div class="group-header">
          <span class="group-title">{{ group.templateName }}</span>
          <el-tag size="small" type="info">
            {{ group.executions.length }} 个站点
          </el-tag>
        </div>
      </template>

      <el-table :data="group.executions" border stripe>
        <el-table-column prop="stationCode" label="站位编号" width="120" />
        <el-table-column prop="stationName" label="站位名称" width="160" />
        <el-table-column label="数据状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getExecutionStatusType(row.status)" size="small">
              {{ ExecutionStatusName[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交数据" min-width="400">
          <template #default="{ row }">
            <div class="data-value-cell">
              <template v-if="row.dataValue && row.dataValue.includes(';')">
                <div v-for="(item, idx) in row.dataValue.split(';')" :key="idx" class="indicator-item">
                  {{ item.trim() }}
                </div>
              </template>
              <span v-else>{{ row.dataValue || '-' }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 校验意见 -->
    <el-card class="verify-action-card">
      <template #header>
        <span>校验意见</span>
      </template>

      <el-input
        v-model="verifyComment"
        type="textarea"
        :rows="4"
        placeholder="请输入校验意见（通过或退回均需填写意见）"
      />

      <div class="verify-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="danger" @click="handleReject">
          <el-icon><CircleClose /></el-icon>
          退回修改
        </el-button>
        <el-button type="primary" @click="handleApprove">
          <el-icon><CircleCheck /></el-icon>
          校验通过
        </el-button>
      </div>
    </el-card>
  </div>

  <el-empty v-else description="任务不存在" />
</template>

<style scoped>
.data-verify {
  max-width: 1200px;
  margin: 0 auto;
}

.header-card,
.verify-group-card,
.verify-action-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.data-value-cell {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.verify-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>
