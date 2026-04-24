/**
 * localStorage 封装
 */

const PREFIX = 'taskflow_'

export const storage = {
  /**
   * 设置数据
   */
  set(key, value) {
    try {
      const data = JSON.stringify(value)
      localStorage.setItem(PREFIX + key, data)
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },

  /**
   * 获取数据
   */
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(PREFIX + key)
      if (data === null) return defaultValue
      return JSON.parse(data)
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  /**
   * 移除数据
   */
  remove(key) {
    localStorage.removeItem(PREFIX + key)
  },

  /**
   * 清空所有数据
   */
  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
  }
}

export default storage
