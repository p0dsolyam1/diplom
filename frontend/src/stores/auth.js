import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useExerciseStore } from './exercise.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))

  // 'login' | 'register' | 'app' | 'admin'
  const page = ref(_initialPage())

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin    = computed(() => user.value?.role === 'admin')

  function _initialPage() {
    const t = localStorage.getItem('auth_token')
    const u = JSON.parse(localStorage.getItem('auth_user') || 'null')
    if (!t || !u) return 'login'
    return u.role === 'admin' ? 'admin' : 'app'
  }

  function _save(t, u) {
    token.value = t
    user.value  = u
    localStorage.setItem('auth_token', t)
    localStorage.setItem('auth_user', JSON.stringify(u))
  }

  async function login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Ошибка входа')
    useExerciseStore().reset()
    _save(data.token, data.user)
    page.value = data.user.role === 'admin' ? 'admin' : 'app'
  }

  async function register(username, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Ошибка регистрации')
    useExerciseStore().reset()
    _save(data.token, data.user)
    page.value = 'app'
  }

  function logout() {
    useExerciseStore().reset()
    token.value = null
    user.value  = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    page.value = 'login'
  }

  function setPage(p) {
    page.value = p
  }

  return { token, user, page, isLoggedIn, isAdmin, login, register, logout, setPage }
})
