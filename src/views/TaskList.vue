<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { TaskStatus, TaskStatusName, TaskStatusColor, FrequencyName, FlowAction } from '../types'
import { ElMessage } from 'element-plus'
import ApprovalDialog from '../components/ApprovalDialog.vue'

const router = useRouter()
const taskStore = useTaskStore()

const statusFilter = ref('')
const searchKeyword = ref('')

// 过滤后的任务列表
const filteredTasks = computed(() => {
  let result = taskStore.taskList

  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(t => t.status === statusFilter.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(kw) ||
      t.taskCode.toLowerCase().includes(kw)
    )
  }

  return result
})

// 状态选项
const statusOptions = Object.entries(TaskStatusName).map(([value, label]) => ({
  value,
  label
}))

// 获取任务可用的动作
function getAvailableActions(task) {
  const actions = []

  if (task.status === TaskStatus.DRAFT || task.status === TaskStatus.REJECTED) {
    actions.push({ key: 'edit', label: '编辑', icon: 'Edit' })
    actions.push({ key: 'submit', label: '提交审核', icon: 'Upload' })
    if (task.status === TaskStatus.DRAFT) {
      actions.push({ key: 'delete', label: '删除', icon: 'Delete' })
    }
  }

  if (task.status === TaskStatus.PENDING) {
    actions.push({ key: 'approve', label: '审核', icon: 'CircleCheck' })
    actions.push({ key: 'reject', label: '驳回', icon: 'CircleClose' })
  }

  if (task.status === TaskStatus.APPROVED) {
    actions.push({ key: 'start', label: '启动任务', icon: 'VideoPlay' })
  }

  if (task.status === TaskStatus.RUNNING) {
    actions.push({ key: 'complete', label: '完成任务', icon: 'Finished' })
  }

  if (task.status === TaskStatus.COMPLETED) {
    actions.push({ key: 'view', label: '查看', icon: 'View' })
  }

  return actions
}

// 执行动作
async function handleAction(key, task) {
  switch (key) {
    case 'edit':
      router.push(`/tasks/${task.id}/edit`)
      break
    case 'submit':
      await taskStore.submitTask(task.id, '当前用户', '提交审核')
      break
    case 'approve':
      approvalDialogRef.value?.open(task, 'approve')
      break
    case 'reject':
      approvalDialogRef.value?.open(task, 'reject')
      break
    case 'start':
      await taskStore.startTask(task.id, '管理员', '启动任务')
      break
    case 'complete':
      await taskStore.completeTask(task.id, '管理员', '完成任务')
      break
    case 'delete':
      await handleDelete(task)
      break
    case 'view':
      router.push(`/tasks/${task.id}`)
      break
  }
}

// 删除任务
async function handleDelete(task) {
  const result = await taskStore.deleteTask(task.id)
  if (!result.success) {
    ElMessage.error(result.message)
  }
}

// 重置数据
function handleResetData() {
  taskStore.resetData()
  ElMessage.success('数据已重置')
}

// 审核对话框引用
const approvalDialogRef = ref(null)

// 审核结果处理
function onApprovalResult(result) {
  if (result.action === 'approve') {
    taskStore.approveTask(result.taskId, '审核人', result.comment)
  } else {
    taskStore.rejectTask(result.taskId, '审核人', result.comment)
  }
}

// 跳转到创建页面
function goToCreate() {
  router.push('/tasks/create')
}

// 跳转到详情
function goToDetail(task) {
  router.push(`/tasks/${task.id}`)
}

// 获取状态标签类型
function getStatusTagType(status) {
  return TaskStatusColor[status] || 'info'
}
</script>

<template>
  <div class="task-list">
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索任务编号/名称"
            style="width: 200px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            clearable
            style="width: 150px; margin-left: 10px"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="toolbar-right">
          <el-button type="primary" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            创建任务
          </el-button>
          <el-button type="warning" @click="handleResetData">
            <el-icon><Refresh /></el-icon>
            重置数据
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 任务表格 -->
    <el-card class="table-card">
      <el-table
        :data="filteredTasks"
        border
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
      >
        <el-table-column prop="taskCode" label="任务编号" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="goToDetail(row)">
              {{ row.taskCode }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="task-name-cell">
              <span>{{ row.name }}</span>
              <el-tooltip v-if="row.description" :content="row.description" placement="top">
                <el-icon class="desc-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="frequency" label="监测频次" width="100">
          <template #default="{ row }">
            {{ FrequencyName[row.frequency] || row.frequency }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ TaskStatusName[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="timeRange" label="时间范围" width="220">
          <template #default="{ row }">
            {{ row.startTime }} ~ {{ row.endTime }}
          </template>
        </el-table-column>

        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <template v-for="action in getAvailableActions(row)" :key="action.key">
                <el-button
                  :type="action.key === 'delete' ? 'danger' : action.key === 'reject' ? 'warning' : 'primary'"
                  size="small"
                  text
                  @click="handleAction(action.key, row)"
                >
                  <el-icon><component :is="action.icon" /></el-icon>
                  {{ action.label }}
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="filteredTasks.length === 0"
        description="暂无任务"
        style="padding: 40px 0"
      >
        <el-button type="primary" @click="goToCreate">创建第一个任务</el-button>
      </el-empty>
    </el-card>

    <!-- 审核对话框 -->
    <ApprovalDialog ref="approvalDialogRef" @result="onApprovalResult" />
  </div>
</template>

<style scoped>
.task-list {
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
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}

.table-card {
  margin-bottom: 20px;
}

.task-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.desc-icon {
  color: #909399;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
}

.action-buttons .el-button {
  padding: 4px 8px;
  font-size: 14px;
}
</style>
