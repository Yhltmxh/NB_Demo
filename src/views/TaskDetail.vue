<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { TaskStatusName, TaskStatusColor, FrequencyName, DepthTypeName, FlowActionName, TaskStatus } from '../types'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const taskId = computed(() => route.params.id)
const task = computed(() => taskStore.getTaskById(taskId.value))
const flows = computed(() => taskStore.getFlowsByTaskId(taskId.value))

// 数据统计
const dataStats = computed(() => {
  if (!task.value) return null
  return taskStore.getDataStatistics(taskId.value)
})

// 获取状态标签类型
function getStatusTagType(status) {
  return TaskStatusColor[status] || 'info'
}

// 深度配置显示
const depthDisplay = computed(() => {
  if (!task.value) return ''
  const { depths } = task.value.monitoringConfig
  if (depths.type === 'custom') {
    return depths.customDepths.join(', ') || '未设置'
  }
  return DepthTypeName[depths.type] || depths.type
})

// 返回列表
function goBack() {
  router.push('/tasks')
}

// 编辑任务
function editTask() {
  router.push(`/tasks/${taskId.value}/edit`)
}

// 跳转到数据录入
function goToDataEntry() {
  router.push(`/tasks/${taskId.value}/data-entry`)
}
</script>

<template>
  <div class="task-detail" v-if="task">
    <!-- 基本信息卡片 -->
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>任务信息</span>
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

    <!-- 数据录入卡片 -->
    <el-card class="data-entry-card">
      <template #header>
        <div class="card-header">
          <span>数据录入</span>
          <el-button type="primary" size="small" @click="goToDataEntry">
            <el-icon><Edit /></el-icon>
            进入数据录入
          </el-button>
        </div>
      </template>

      <div class="data-stats">
        <div class="stat-item">
          <div class="stat-value">{{ dataStats?.total || 0 }}</div>
          <div class="stat-label">应录入总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value success">{{ dataStats?.filled || 0 }}</div>
          <div class="stat-label">已录入</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ dataStats?.missing || 0 }}</div>
          <div class="stat-label">缺失</div>
        </div>
        <div class="stat-item">
          <div class="stat-progress">
            <el-progress
              type="circle"
              :percentage="dataStats?.completionRate || 0"
              :status="dataStats?.completionRate >= 100 ? 'success' : dataStats?.completionRate >= 50 ? 'warning' : 'exception'"
              :stroke-width="10"
              :width="80"
            />
          </div>
          <div class="stat-label">完成率</div>
        </div>
      </div>

      <!-- 缺失项提示 -->
      <div class="missing-warning" v-if="dataStats?.missing > 0">
        <el-alert
          :title="`还有 ${dataStats.missing} 项数据未录入`"
          type="warning"
          show-icon
          :closable="false"
        />
        <el-button type="warning" size="small" plain @click="goToDataEntry" style="margin-top: 10px">
          前往录入
        </el-button>
      </div>

      <!-- 全部完成提示 -->
      <div class="complete-tip" v-else-if="dataStats?.total > 0">
        <el-alert
          title="所有数据已录入完成"
          type="success"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>

    <!-- 监测配置卡片 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>监测配置</span>
        </div>
      </template>

      <!-- 站位配置 -->
      <div class="config-section">
        <h4 class="section-title">站位配置 ({{ task.monitoringConfig.stations.length }}个)</h4>
        <el-table
          :data="task.monitoringConfig.stations"
          border
          stripe
          max-height="250"
        >
          <el-table-column prop="code" label="站位编号" width="120" />
          <el-table-column prop="name" label="站位名称" width="150" />
          <el-table-column prop="longitude" label="经度" width="120" />
          <el-table-column prop="latitude" label="纬度" width="120" />
          <el-table-column prop="depth" label="水深(m)" width="100">
            <template #default="{ row }">
              {{ row.depth !== null && row.depth !== undefined ? row.depth + 'm' : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 指标配置 -->
      <div class="config-section">
        <h4 class="section-title">指标配置 ({{ task.monitoringConfig.indicators.length }}个)</h4>
        <div class="indicators-list">
          <el-tag
            v-for="ind in task.monitoringConfig.indicators"
            :key="ind.id"
            size="small"
            style="margin-right: 8px; margin-bottom: 4px"
          >
            {{ ind.name }}
            <span v-if="ind.unit" style="color: #909399">({{ ind.unit }})</span>
          </el-tag>
        </div>
      </div>

      <!-- 深度配置 -->
      <div class="config-section">
        <h4 class="section-title">深度配置</h4>
        <el-tag type="primary" size="large">
          {{ depthDisplay }}
        </el-tag>
      </div>
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

    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
    </div>
  </div>

  <el-empty v-else description="任务不存在" />
</template>

<style scoped>
.task-detail {
  max-width: 1000px;
  margin: 0 auto;
}

.info-card,
.data-entry-card,
.config-card,
.flow-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.config-section {
  margin-bottom: 20px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}

.indicators-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

/* 数据统计样式 */
.data-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-progress {
  display: flex;
  justify-content: center;
}

.missing-warning,
.complete-tip {
  padding: 10px 0;
}
</style>
