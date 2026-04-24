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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
