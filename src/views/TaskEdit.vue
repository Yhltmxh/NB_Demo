<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { useTemplateStore } from '../stores/template'
import { Frequency, FrequencyName } from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const templateStore = useTemplateStore()

const taskId = computed(() => route.params.id)
const task = computed(() => taskStore.getTaskById(taskId.value))

const formData = ref({
  taskCode: '',
  name: '',
  startTime: '',
  endTime: '',
  frequency: Frequency.ONCE,
  description: '',
  creator: '',
  monitoringConfig: {
    stations: []
  }
})

const formRef = ref(null)
const formRules = {
  taskCode: [
    { required: true, message: '请输入任务编号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  frequency: [
    { required: true, message: '请选择监测频次', trigger: 'change' }
  ]
}

const frequencyOptions = Object.entries(FrequencyName).map(([value, label]) => ({
  value,
  label
}))

const subTaskTypeOptions = computed(() =>
  templateStore.enabledTemplates.map(t => ({
    value: t.code,
    label: t.name
  }))
)

const newStation = ref({
  code: '',
  name: '',
  subTaskTypes: []
})

// 模板选择弹窗
const templateDialogVisible = ref(false)
const tempTemplateSelection = ref([])

function openTemplateDialog() {
  tempTemplateSelection.value = [...newStation.value.subTaskTypes]
  templateDialogVisible.value = true
}

function confirmTemplateSelection() {
  newStation.value.subTaskTypes = [...tempTemplateSelection.value]
  templateDialogVisible.value = false
}

function cancelTemplateSelection() {
  templateDialogVisible.value = false
}

function getTemplateName(code) {
  const tpl = templateStore.getTemplateByCode(code)
  return tpl ? tpl.name : code
}

onMounted(() => {
  templateStore.initialize()
  if (task.value) {
    formData.value = JSON.parse(JSON.stringify(task.value))
  }
})

function addStation() {
  if (!newStation.value.code || !newStation.value.name) {
    ElMessage.warning('请填写站位编号和名称')
    return
  }

  if (newStation.value.subTaskTypes.length === 0) {
    ElMessage.warning('请至少选择一个子任务类型')
    return
  }

  formData.value.monitoringConfig.stations.push({
    ...newStation.value,
    subTaskTypes: [...newStation.value.subTaskTypes]
  })

  newStation.value = { code: '', name: '', subTaskTypes: [] }
}

function removeStation(index) {
  formData.value.monitoringConfig.stations.splice(index, 1)
}

async function handleSubmit() {
  try {
    await formRef.value.validate()

    if (formData.value.monitoringConfig.stations.length === 0) {
      ElMessage.warning('请至少添加一个站位')
      return
    }

    const hasSelected = formData.value.monitoringConfig.stations.some(s => s.subTaskTypes.length > 0)
    if (!hasSelected) {
      ElMessage.warning('请至少为一个站位选择子任务类型')
      return
    }

    const result = taskStore.updateTask(taskId.value, formData.value)

    if (result.success) {
      ElMessage.success('任务更新成功')
      router.push('/tasks')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

function handleCancel() {
  router.push(`/tasks/${taskId.value}`)
}
</script>

<template>
  <div class="task-edit">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <el-button size="small" @click="handleCancel">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span>编辑任务</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="task-form"
      >
        <!-- 基础信息 -->
        <div class="form-section">
          <h3 class="section-title">基础信息</h3>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="任务编号" prop="taskCode">
                <el-input v-model="formData.taskCode" placeholder="如 HJ-2024-004" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="任务名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入任务名称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始时间" prop="startTime">
                <el-date-picker
                  v-model="formData.startTime"
                  type="date"
                  placeholder="选择开始时间"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束时间" prop="endTime">
                <el-date-picker
                  v-model="formData.endTime"
                  type="date"
                  placeholder="选择结束时间"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="监测频次" prop="frequency">
                <el-select v-model="formData.frequency" placeholder="选择监测频次" style="width: 100%">
                  <el-option
                    v-for="option in frequencyOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建人">
                <el-input v-model="formData.creator" placeholder="创建人" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="任务描述">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入任务描述（可选）"
            />
          </el-form-item>
        </div>

        <!-- 站点配置 -->
        <div class="form-section">
          <h3 class="section-title">站点配置</h3>

          <!-- 站位表格 -->
          <el-table
            :data="formData.monitoringConfig.stations"
            border
            stripe
            style="margin-bottom: 20px"
            v-if="formData.monitoringConfig.stations.length > 0"
          >
            <el-table-column prop="code" label="站位编号" width="120" />
            <el-table-column prop="name" label="站位名称" width="150" />
            <el-table-column label="分配的子任务" min-width="200">
              <template #default="{ row }">
                <div class="station-template-tags">
                  <el-tag
                    v-for="code in row.subTaskTypes"
                    :key="code"
                    size="small"
                    type="primary"
                    style="margin-right: 4px"
                  >{{ getTemplateName(code) }}</el-tag>
                  <span v-if="!row.subTaskTypes || row.subTaskTypes.length === 0" class="no-data">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button type="danger" size="small" text class="delete-btn" @click="removeStation($index)">
                  <el-icon :size="18"><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 添加站位表单 -->
          <div class="add-station-form">
            <el-row :gutter="15" align="middle">
              <el-col :span="5">
                <el-input v-model="newStation.code" placeholder="站位编号" />
              </el-col>
              <el-col :span="5">
                <el-input v-model="newStation.name" placeholder="站位名称" />
              </el-col>
              <el-col :span="8">
                <el-button @click="openTemplateDialog" style="width: 100%">
                  <el-icon><List /></el-icon>
                  {{ newStation.subTaskTypes.length > 0 ? `已选 ${newStation.subTaskTypes.length} 项` : '选择子任务类型' }}
                </el-button>
                <div v-if="newStation.subTaskTypes.length > 0" class="selected-tags">
                  <el-tag
                    v-for="code in newStation.subTaskTypes"
                    :key="code"
                    size="small"
                    class="template-tag"
                  >{{ getTemplateName(code) }}</el-tag>
                </div>
              </el-col>
              <el-col :span="4">
                <el-button type="primary" @click="addStation">
                  <el-icon><Plus /></el-icon>
                  添加
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 模板选择弹窗 -->
          <el-dialog v-model="templateDialogVisible" title="选择子任务类型" width="500px">
            <el-checkbox-group v-model="tempTemplateSelection">
              <el-checkbox
                v-for="typeOption in subTaskTypeOptions"
                :key="typeOption.value"
                :value="typeOption.value"
                :label="typeOption.label"
                class="dialog-checkbox"
              />
            </el-checkbox-group>
            <template #footer>
              <el-button @click="cancelTemplateSelection">取消</el-button>
              <el-button type="primary" @click="confirmTemplateSelection">确定</el-button>
            </template>
          </el-dialog>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            保存修改
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.task-edit {
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-form {
  max-width: 700px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.station-template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.no-data {
  color: #c0c4cc;
}

.add-station-form {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.template-tag {
  font-size: 12px;
}

.dialog-checkbox {
  display: block;
  padding: 6px 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
