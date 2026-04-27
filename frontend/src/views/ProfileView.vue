<template>
  <div class="profile-page">
    <header class="profile-header">
      <div class="logo">🎯 Стрелок — Профиль</div>
      <div class="header-actions">
        <button class="btn-new" @click="goNewExercise">+ Новое упражнение</button>
        <button v-if="authStore.isAdmin" class="btn-admin" @click="authStore.setPage('admin')">Панель admin</button>
        <button class="btn-app" @click="authStore.setPage('app')">К приложению</button>
        <button class="btn-logout" @click="authStore.logout()">Выйти</button>
      </div>
    </header>

    <main class="profile-main">
      <div class="section-header">
        <h2>История упражнений</h2>
        <span class="count-badge">{{ exercises.length }}</span>
      </div>

      <div v-if="loading" class="hint">Загрузка...</div>
      <div v-else-if="!exercises.length" class="hint">
        Упражнений пока нет.
        <button class="link-btn" @click="goNewExercise">Начать первое</button>
      </div>

      <div v-else class="exercise-list">
        <div
          v-for="ex in exercises"
          :key="ex.id"
          class="exercise-card"
        >
          <!-- Заголовок карточки -->
          <div class="card-header" @click="toggle(ex.id)">
            <div class="card-meta">
              <span class="ex-number">#{{ ex.user_exercise_number }}</span>
              <span class="ex-date">{{ formatDate(ex.started_at) }}</span>
              <span class="ex-duration">{{ duration(ex) }}</span>
            </div>
            <div class="card-stats">
              <span class="hits-badge">{{ ex.hit_count }} попаданий</span>
              <span v-if="!ex.finished_at" class="badge-active">не завершено</span>
            </div>
            <div class="card-actions">
              <span class="expand-icon">{{ expanded === ex.id ? '▲' : '▼' }}</span>
              <button class="btn-delete" @click.stop="deleteExercise(ex.id)" title="Удалить">✕</button>
            </div>
          </div>

          <!-- Детали (раскрывается по клику) -->
          <div v-if="expanded === ex.id" class="card-detail">
            <div v-if="detailLoading" class="hint">Загрузка деталей...</div>
            <template v-else-if="detail">
              <div class="detail-body">
                <!-- Мишень -->
                <div class="target-wrap">
                  <TargetCanvas :hits="detail.hits ?? []" :size="220" />
                </div>

                <!-- Таблица попаданий -->
                <div class="hits-wrap">
                  <table v-if="detail.hits?.length" class="hits-table">
                    <thead>
                      <tr><th>#</th><th>X</th><th>Y</th><th>Время</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(h, i) in detail.hits" :key="i">
                        <td>{{ i + 1 }}</td>
                        <td>{{ Math.round(h.x) }}</td>
                        <td>{{ Math.round(h.y) }}</td>
                        <td>{{ formatTime(h.timestamp) }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p v-else class="hint">Попаданий не зафиксировано</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useExerciseStore } from '../stores/exercise.js'
import { authFetch } from '../utils/api.js'
import TargetCanvas from '../components/TargetCanvas.vue'

const authStore     = useAuthStore()
const exerciseStore = useExerciseStore()

const exercises    = ref([])
const loading      = ref(true)
const expanded     = ref(null)
const detail       = ref(null)
const detailLoading = ref(false)

async function loadExercises() {
  loading.value = true
  try {
    const res = await authFetch('/api/exercises')
    exercises.value = await res.json()
  } finally {
    loading.value = false
  }
}

async function toggle(id) {
  if (expanded.value === id) {
    expanded.value = null
    detail.value   = null
    return
  }
  expanded.value    = id
  detail.value      = null
  detailLoading.value = true
  try {
    const res = await authFetch(`/api/exercises/${id}`)
    detail.value = await res.json()
  } finally {
    detailLoading.value = false
  }
}

async function deleteExercise(id) {
  if (!confirm('Удалить упражнение и все его попадания?')) return
  await authFetch(`/api/exercises/${id}`, { method: 'DELETE' })
  exercises.value = exercises.value.filter(e => e.id !== id)
  if (expanded.value === id) { expanded.value = null; detail.value = null }
}

function goNewExercise() {
  exerciseStore.reset()
  authStore.setPage('app')
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function duration(ex) {
  if (!ex.finished_at) return '—'
  const ms = new Date(ex.finished_at) - new Date(ex.started_at)
  const s  = Math.round(ms / 1000)
  if (s < 60) return `${s}с`
  return `${Math.floor(s / 60)}м ${s % 60}с`
}

onMounted(loadExercises)
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #0d1117;
  color: #e6edf3;
  display: flex;
  flex-direction: column;
}

.profile-header {
  height: 56px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 12px;
}

.logo { font-size: 16px; font-weight: 700; }

.header-actions { display: flex; gap: 8px; align-items: center; }

.btn-new {
  background: #238636; color: #fff; border: none;
  border-radius: 6px; padding: 6px 14px;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-new:hover { background: #2ea043; }

.btn-admin {
  background: #2d1f6e; color: #a5a3f5; border: none;
  border-radius: 6px; padding: 6px 14px; font-size: 13px; cursor: pointer;
}
.btn-admin:hover { background: #3d2d8a; }

.btn-app {
  background: #1f6feb; color: #fff; border: none;
  border-radius: 6px; padding: 6px 14px; font-size: 13px; cursor: pointer;
}
.btn-app:hover { background: #388bfd; }

.btn-logout {
  background: #21262d; color: #e6edf3;
  border: 1px solid #30363d; border-radius: 6px;
  padding: 6px 14px; font-size: 13px; cursor: pointer;
}
.btn-logout:hover { background: #30363d; }

.profile-main {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 28px 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.section-header h2 { font-size: 18px; font-weight: 700; }

.count-badge {
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 2px 10px;
  font-size: 13px;
  color: #8b949e;
}

.hint {
  color: #8b949e;
  font-size: 14px;
  padding: 20px 0;
}

.link-btn {
  background: none; border: none;
  color: #58a6ff; cursor: pointer;
  font-size: 14px; text-decoration: underline; padding: 0;
}

.exercise-list { display: flex; flex-direction: column; gap: 10px; }

.exercise-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.exercise-card:hover { border-color: #58a6ff; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  gap: 12px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.ex-number {
  font-size: 16px;
  font-weight: 700;
  color: #58a6ff;
  min-width: 36px;
}

.ex-date { font-size: 13px; color: #e6edf3; }
.ex-duration { font-size: 13px; color: #8b949e; }

.card-stats { display: flex; align-items: center; gap: 8px; }

.hits-badge {
  background: #0d2a0d;
  color: #3fb950;
  border: 1px solid #238636;
  border-radius: 10px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge-active {
  background: #2a1a00;
  color: #e3b341;
  border: 1px solid #9e6a03;
  border-radius: 10px;
  padding: 3px 10px;
  font-size: 12px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon { color: #8b949e; font-size: 11px; }

.btn-delete {
  background: transparent;
  border: 1px solid #30363d;
  color: #8b949e;
  border-radius: 4px;
  width: 26px; height: 26px;
  cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}
.btn-delete:hover { color: #f85149; border-color: #f85149; }

/* Детали упражнения */
.card-detail {
  border-top: 1px solid #30363d;
  padding: 20px 16px;
}

.detail-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.target-wrap { flex-shrink: 0; }

.hits-wrap {
  flex: 1;
  min-width: 240px;
  max-height: 260px;
  overflow-y: auto;
}

.hits-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.hits-table th, .hits-table td {
  padding: 7px 12px;
  text-align: left;
  border-bottom: 1px solid #21262d;
}

.hits-table th {
  color: #8b949e;
  font-weight: 600;
  position: sticky;
  top: 0;
  background: #161b22;
}

.hits-table tr:last-child td { border-bottom: none; }
.hits-table tr:hover td { background: #1c2128; }
</style>
