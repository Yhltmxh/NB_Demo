/**
 * Vue Router 配置
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/tasks'
  },
  {
    path: '/tasks',
    name: 'TaskList',
    component: () => import('../views/TaskList.vue'),
    meta: { title: '任务列表' }
  },
  {
    path: '/tasks/create',
    name: 'TaskCreate',
    component: () => import('../views/TaskCreate.vue'),
    meta: { title: '创建任务' }
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('../views/TaskDetail.vue'),
    meta: { title: '任务详情' }
  },
  {
    path: '/tasks/:id/edit',
    name: 'TaskEdit',
    component: () => import('../views/TaskEdit.vue'),
    meta: { title: '编辑任务' }
  },
  {
    path: '/tasks/:taskId/subtask/:subTaskType',
    name: 'SubTaskDetail',
    component: () => import('../views/SubTaskDetail.vue'),
    meta: { title: '子任务详情' }
  },
  {
    path: '/tasks/:taskId/verify',
    name: 'DataVerify',
    component: () => import('../views/DataVerify.vue'),
    meta: { title: '数据校验' }
  },
  {
    path: '/tasks/:taskId/subtask/:subTaskType/station/:stationCode',
    name: 'DataFill',
    component: () => import('../views/DataFill.vue'),
    meta: { title: '数据填写' }
  },
  {
    path: '/templates',
    name: 'TemplateList',
    component: () => import('../views/TemplateList.vue'),
    meta: { title: '子任务模板管理' }
  },
  {
    path: '/templates/create',
    name: 'TemplateCreate',
    component: () => import('../views/TemplateCreate.vue'),
    meta: { title: '创建模板' }
  },
  {
    path: '/templates/:id/edit',
    name: 'TemplateEdit',
    component: () => import('../views/TemplateCreate.vue'),
    meta: { title: '编辑模板' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
