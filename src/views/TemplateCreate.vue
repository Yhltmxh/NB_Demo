<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplateStore } from '../stores/template'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const templateStore = useTemplateStore()

const templateId = computed(() => route.params.id)
const isEdit = computed(() => !!templateId.value)

const formData = ref({
  name: '',
  code: '',
  description: '',
  enabled: true,
  indicators: []
})

const formRef = ref(null)

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '编码只能包含小写字母和下划线', trigger: 'blur' }
  ]
}

// 新增指标临时数据
const newIndicator = ref({
  name: '',
  unit: ''
})

// 为每个指标生成唯一ID
let indicatorSeq = Date.now()
function genIndicatorId() {
  return 'ind_' + (indicatorSeq++)
}

// 添加指标
function addIndicator() {
  const name = newIndicator.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入指标名称')
    return
  }
  formData.value.indicators.push({
    id: genIndicatorId(),
    name: name,
    unit: newIndicator.value.unit.trim(),
    category: ''
  })
  newIndicator.value = { name: '', unit: '' }
}

// 删除指标
function removeIndicator(index) {
  formData.value.indicators.splice(index, 1)
}

onMounted(() => {
  templateStore.initialize()
  if (isEdit.value) {
    const template = templateStore.getTemplateById(templateId.value)
    if (template) {
      formData.value = {
        name: template.name,
        code: template.code,
        description: template.description,
        enabled: template.enabled,
        indicators: template.indicators.map(i => ({ ...i }))
      }
      indicatorSeq = Date.now()
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value.validate()

    if (formData.value.indicators.length === 0) {
      ElMessage.warning('请至少添加一个指标')
      return
    }

    if (isEdit.value) {
      templateStore.updateTemplate(templateId.value, formData.value)
      ElMessage.success('更新成功')
    } else {
      templateStore.createTemplate(formData.value)
      ElMessage.success('创建成功')
    }

    router.push('/templates')
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

function handleCancel() {
  router.push('/templates')
}
</script>

<template>
  <div class="template-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button size="small" @click="handleCancel">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span>{{ isEdit ? '编辑模板' : '新建模板' }}</span>
        </div>
      </template>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：水质、沉积物、生物" />
        </el-form-item>

        <el-form-item label="模板编码" prop="code">
          <el-input v-model="formData.code" placeholder="如：water、sediment、biology" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="模板描述（可选）" />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="formData.enabled" />
        </el-form-item>

        <el-form-item label="指标配置">
          <div class="indicators-config">
            <!-- 指标表格 -->
            <el-table :data="formData.indicators" border stripe style="margin-bottom: 15px" v-if="formData.indicators.length > 0">
              <el-table-column prop="name" label="指标名称" min-width="200" />
              <el-table-column prop="unit" label="单位" width="120" align="center">
                <template #default="{ row }">
                  {{ row.unit || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" size="small" text @click="removeIndicator($index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 添加指标 -->
            <div class="add-indicator-form">
              <el-row :gutter="10" align="middle">
                <el-col :span="10">
                  <el-input v-model="newIndicator.name" placeholder="指标名称" @keyup.enter="addIndicator" />
                </el-col>
                <el-col :span="8">
                  <el-input v-model="newIndicator.unit" placeholder="单位（可选）" @keyup.enter="addIndicator" />
                </el-col>
                <el-col :span="6">
                  <el-button type="primary" @click="addIndicator">
                    <el-icon><Plus /></el-icon>
                    添加指标
                  </el-button>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="已选指标" v-if="formData.indicators.length > 0">
          <div class="selected-indicators">
            <el-tag
              v-for="(ind, index) in formData.indicators"
              :key="ind.id"
              closable
              size="small"
              style="margin-right: 8px; margin-bottom: 4px"
              @close="removeIndicator(index)"
            >
              {{ ind.name }}
              <span v-if="ind.unit" style="color: #909399">({{ ind.unit }})</span>
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.template-create {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.indicators-config {
  width: 100%;
}

.add-indicator-form {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.selected-indicators {
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}
</style>
