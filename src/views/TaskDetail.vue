<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import {
  TaskStatusName,
  TaskStatusColor,
  FrequencyName,
  FlowActionName,
  SubTaskTypeName,
  TaskStatus
} from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const taskId = computed(() => route.params.id)
const task = computed(() => taskStore.getTaskById(taskId.value))
const flows = computed(() => taskStore.getFlowsByTaskId(taskId.value))

// 子任务列表
const subTasks = computed(() => taskStore.getSubTasksByTaskId(taskId.value))

// 任务总进度
const taskProgress = computed(() => taskStore.getTaskProgress(taskId.value))

// 获取状态标签类型
function getStatusTagType(status) {
  return TaskStatusColor[status] || 'info'
}

// 获取子任务进度
function getSubTaskProgress(subTaskType) {
  return taskStore.getSubTaskProgress(taskId.value, subTaskType)
}

// 跳转到子任务详情
function goToSubTaskDetail(subTaskType) {
  router.push(`/tasks/${taskId.value}/subtask/${subTaskType}`)
}

// 返回列表
function goBack() {
  router.push('/tasks')
}

// 编辑任务
function editTask() {
  router.push(`/tasks/${taskId.value}/edit`)
}
</script>

<template>
  <div class="task-detail" v-if="task">
    <!-- 基本信息卡片 -->
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button size="small" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span>任务信息</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="editTask" v-if="task.status === 'draft' || task.status === 'rejected'">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务编号">
          {{ task.taskCode }}
        </el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag :type="getStatusTagType(task.status)" size="small">
            {{ TaskStatusName[task.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="任务名称" :span="2">
          {{ task.name }}
        </el-descriptions-item>
        <el-descriptions-item label="监测频次">
          {{ FrequencyName[task.frequency] }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ task.creator }}
        </el-descriptions-item>
        <el-descriptions-item label="时间范围">
          {{ task.startTime }} ~ {{ task.endTime }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ task.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="2" v-if="task.description">
          {{ task.description }}
        </el-descriptions-item>
        <el-descriptions-item label="驳回原因" :span="2" v-if="task.status === 'rejected' && task.rejectReason">
          <el-alert type="warning" :title="task.rejectReason" :closable="false" show-icon />
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 任务总进度 -->
    <el-card class="progress-card" v-if="task.status === 'running' || task.status === 'completed'">
      <template #header>
        <div class="card-header">
          <span>任务总进度</span>
        </div>
      </template>

      <div class="task-progress">
        <div class="progress-main">
          <el-progress
            :percentage="taskProgress"
            :status="taskProgress >= 100 ? 'success' : taskProgress >= 50 ? 'warning' : 'exception'"
            :stroke-width="20"
            style="flex: 1"
          />
          <span class="progress-text">{{ taskProgress }}%</span>
        </div>
      </div>
    </el-card>

    <!-- 子任务列表 -->
    <el-card class="subtask-card" v-if="subTasks.length > 0">
      <template #header>
        <div class="card-header">
          <span>子任务列表</span>
        </div>
      </template>

      <el-table :data="subTasks" border stripe>
        <el-table-column prop="type" label="子任务类型" width="150">
          <template #default="{ row }">
            <span class="subtask-type">{{ SubTaskTypeName[row.type] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'running' ? 'warning' : 'info'" size="small">
              {{ row.status === 'completed' ? '已完成' : row.status === 'running' ? '进行中' : '待执行' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" min-width="320">
          <template #default="{ row }">
            <div class="subtask-progress">
              <el-progress
                :percentage="getSubTaskProgress(row.type)"
                :status="getSubTaskProgress(row.type) >= 100 ? 'success' : getSubTaskProgress(row.type) >= 50 ? 'warning' : 'exception'"
                :stroke-width="10"
                style="flex: 1"
              />
              <span class="subtask-progress-text">{{ getSubTaskProgress(row.type) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              text
              class="detail-btn"
              @click="goToSubTaskDetail(row.type)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 流转记录卡片 -->
    <el-card class="flow-card">
      <template #header>
        <div class="card-header">
          <span>流转记录</span>
        </div>
      </template>

      <el-timeline v-if="flows.length > 0">
        <el-timeline-item
          v-for="flow in flows"
          :key="flow.id"
          :timestamp="flow.time"
          placement="top"
        >
          <el-card shadow="hover">
            <div class="flow-item">
              <span class="flow-action">
                <el-tag size="small" type="info">
                  {{ FlowActionName[flow.action] }}
                </el-tag>
              </span>
              <span class="flow-operator">操作人: {{ flow.operator }}</span>
              <span class="flow-comment" v-if="flow.comment">备注: {{ flow.comment }}</span>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无流转记录" />
    </el-card>
  </div>

  <el-empty v-else description="任务不存在" />
</template>

<style scoped>
.task-detail {
  max-width: 1000px;
  margin: 0 auto;
}

.info-card,
.progress-card,
.subtask-card,
.flow-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.flow-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flow-action {
  display: inline-block;
}

.flow-operator {
  font-size: 14px;
  color: #606266;
}

.flow-comment {
  font-size: 14px;
  color: #909399;
}

.back-button {
  display: flex;
  justify-content: flex-start;
  margin-top: 20px;
}

/* 任务进度 */
.task-progress {
  padding: 20px;
}

.progress-main {
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-text {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

/* 子任务 */
.subtask-type {
  font-weight: 600;
  color: #409eff;
}

.subtask-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.subtask-progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  min-width: 45px;
}

.detail-btn {
  font-size: 14px;
}
</style>