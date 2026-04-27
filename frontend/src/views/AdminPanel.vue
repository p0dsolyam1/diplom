<template>
  <div class="admin-page">
    <!-- Шапка -->
    <header class="admin-header">
      <div class="logo">🎯 Стрелок — Панель администратора</div>
      <div class="header-actions">
        <button class="btn-app" @click="authStore.setPage('app')">К приложению</button>
        <button class="btn-logout" @click="authStore.logout()">Выйти</button>
      </div>
    </header>

    <main class="admin-main">

      <!-- ── Пользователи ── -->
      <section class="card">
        <h2 class="card-title">Пользователи</h2>

        <!-- Добавить пользователя -->
        <form class="add-form" @submit.prevent="addUser">
          <input v-model="newUser.username" placeholder="Логин" />
          <input v-model="newUser.password" type="password" placeholder="Пароль" />
          <select v-model="newUser.role">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button type="submit" class="btn-add" :disabled="userLoading">Добавить</button>
        </form>
        <div v-if="userError" class="form-error">{{ userError }}</div>

        <!-- Список -->
        <div class="table-wrap">
          <table v-if="users.length">
            <thead>
              <tr>
                <th>ID</th>
                <th>Логин</th>
                <th>Роль</th>
                <th>Дата создания</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="muted">{{ u.id }}</td>
                <td>{{ u.username }}</td>
                <td>
                  <span :class="['role-badge', u.role === 'admin' ? 'role-admin' : 'role-user']">
                    {{ u.role }}
                  </span>
                </td>
                <td class="muted">{{ formatDate(u.created_at) }}</td>
                <td>
                  <button class="btn-delete" @click="deleteUser(u.id)" title="Удалить">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty-hint">Нет пользователей</p>
        </div>
      </section>

      <!-- ── Виды упражнений ── -->
      <section class="card">
        <h2 class="card-title">Виды упражнений</h2>

        <form class="add-form" @submit.prevent="addType">
          <input v-model="newType.name" placeholder="Название" />
          <input v-model="newType.description" placeholder="Описание (необязательно)" class="flex-2" />
          <button type="submit" class="btn-add" :disabled="typeLoading">Добавить</button>
        </form>
        <div v-if="typeError" class="form-error">{{ typeError }}</div>

        <div class="table-wrap">
          <table v-if="types.length">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in types" :key="t.id">
                <td class="muted">{{ t.id }}</td>
                <td>{{ t.name }}</td>
                <td class="muted">{{ t.description || '—' }}</td>
                <td>
                  <button class="btn-delete" @click="deleteType(t.id)" title="Удалить">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty-hint">Виды упражнений не добавлены</p>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { authFetch } from '../utils/api.js'

const authStore = useAuthStore()

// ── Пользователи ──────────────────────────────────────────────────────────────
const users      = ref([])
const userLoading = ref(false)
const userError  = ref(null)
const newUser    = ref({ username: '', password: '', role: 'user' })

async function loadUsers() {
  const res = await authFetch('/api/admin/users')
  users.value = await res.json()
}

async function addUser() {
  userError.value = null
  if (!newUser.value.username || !newUser.value.password) {
    userError.value = 'Заполните логин и пароль'
    return
  }
  userLoading.value = true
  try {
    const res = await authFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUser.value),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    users.value.push(data)
    newUser.value = { username: '', password: '', role: 'user' }
  } catch (err) {
    userError.value = err.message
  } finally {
    userLoading.value = false
  }
}

async function deleteUser(id) {
  if (!confirm('Удалить пользователя?')) return
  await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' })
  users.value = users.value.filter(u => u.id !== id)
}

// ── Виды упражнений ───────────────────────────────────────────────────────────
const types      = ref([])
const typeLoading = ref(false)
const typeError  = ref(null)
const newType    = ref({ name: '', description: '' })

async function loadTypes() {
  const res = await authFetch('/api/admin/exercise-types')
  types.value = await res.json()
}

async function addType() {
  typeError.value = null
  if (!newType.value.name.trim()) {
    typeError.value = 'Укажите название'
    return
  }
  typeLoading.value = true
  try {
    const res = await authFetch('/api/admin/exercise-types', {
      method: 'POST',
      body: JSON.stringify(newType.value),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    types.value.push(data)
    newType.value = { name: '', description: '' }
  } catch (err) {
    typeError.value = err.message
  } finally {
    typeLoading.value = false
  }
}

async function deleteType(id) {
  if (!confirm('Удалить вид упражнения?')) return
  await authFetch(`/api/admin/exercise-types/${id}`, { method: 'DELETE' })
  types.value = types.value.filter(t => t.id !== id)
}

// ── Утилиты ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  loadUsers()
  loadTypes()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #0d1117;
  color: #e6edf3;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 56px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo {
  font-size: 16px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-app {
  background: #1f6feb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-app:hover { background: #388bfd; }

.btn-logout {
  background: #21262d;
  color: #e6edf3;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}
.btn-logout:hover { background: #30363d; }

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 24px;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 10px;
  padding: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 18px;
  color: #e6edf3;
}

.add-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.add-form input,
.add-form select {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 7px 10px;
  color: #e6edf3;
  font-size: 13px;
  outline: none;
  flex: 1;
  min-width: 120px;
}

.add-form input:focus,
.add-form select:focus { border-color: #58a6ff; }

.flex-2 { flex: 2; }

.btn-add {
  background: #238636;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-add:hover:not(:disabled) { background: #2ea043; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.form-error {
  color: #ffa198;
  font-size: 12px;
  margin-bottom: 8px;
}

.table-wrap {
  overflow-x: auto;
  margin-top: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead th {
  text-align: left;
  color: #8b949e;
  font-weight: 500;
  padding: 6px 10px;
  border-bottom: 1px solid #30363d;
}

tbody td {
  padding: 8px 10px;
  border-bottom: 1px solid #21262d;
}

tbody tr:last-child td { border-bottom: none; }

.muted { color: #8b949e; }

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.role-admin {
  background: #2d1f6e;
  color: #a5a3f5;
}

.role-user {
  background: #0d2a0d;
  color: #3fb950;
}

.btn-delete {
  background: transparent;
  border: 1px solid #30363d;
  color: #8b949e;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover { color: #f85149; border-color: #f85149; }

.empty-hint {
  color: #8b949e;
  font-size: 13px;
  margin-top: 12px;
}
</style>
