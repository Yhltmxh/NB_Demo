<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '../stores/template'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const templateStore = useTemplateStore()

onMounted(() => {
  templateStore.initialize()
})

const templates = computed(() => templateStore.templates)

function handleCreate() {
  router.push('/templates/create')
}

function handleEdit(templateId) {
  router.push(`/templates/${templateId}/edit`)
}

async function handleDelete(template) {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板"${template.name}"吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning' }
    )
    const result = templateStore.deleteTemplate(template.id)
    if (result.success) {
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

function handleToggleEnabled(template) {
  const result = templateStore.toggleTemplateEnabled(template.id)
  if (result.success) {
    ElMessage.success(template.enabled ? '已禁用' : '已启用')
  }
}

function handleResetData() {
  templateStore.resetToDefault()
  ElMessage.success('数据已重置')
}
</script>

<template>
  <div class="template-list">
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">子任务模板管理</span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
          <el-button type="warning" @click="handleResetData">
            <el-icon><Refresh /></el-icon>
            重置数据
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card">
      <el-table :data="templates" border stripe style="width: 100%" :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }">
        <el-table-column prop="name" label="模板名称" width="150">
          <template #default="{ row }">
            <span class="template-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="指标数量" width="100" align="center">
          <template #default="{ row }">
            <span class="indicator-count">{{ row.indicators.length }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" text @click="handleEdit(row.id)">编辑</el-button>
              <el-button size="small" text @click="handleToggleEnabled(row)">
                {{ row.enabled ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.template-list {
  max-width: 1400px;
  margin: 0 auto;
}

.toolbar-card,
.table-card {
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

.toolbar-title {
  font-weight: 600;
  font-size: 16px;
}

.template-name {
  font-weight: 600;
  color: #409eff;
}

.indicator-count {
  font-weight: 600;
  color: #303133;
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
