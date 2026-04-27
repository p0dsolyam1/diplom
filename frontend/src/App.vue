<template>
  <!-- Аутентификация -->
  <LoginView    v-if="authStore.page === 'login'"    />
  <RegisterView v-else-if="authStore.page === 'register'" />
  <AdminPanel   v-else-if="authStore.page === 'admin'"   />

  <!-- Основное приложение -->
  <div class="app" v-else>
    <header class="app-header">
      <div class="logo">🎯 Стрелок</div>

      <div class="header-center" v-if="exerciseStore.exerciseId">
        Упражнение #{{ exerciseStore.userExerciseNumber }}
      </div>

      <div class="header-right">
        <span class="username">{{ authStore.user?.username }}</span>
        <button
          v-if="authStore.isAdmin"
          class="btn-header btn-admin"
          @click="authStore.setPage('admin')"
        >Панель admin</button>
        <button class="btn-header btn-logout" @click="authStore.logout()">Выйти</button>
      </div>
    </header>

    <main class="app-main">
      <section class="panel panel-camera">
        <CameraView />
        <Controls class="mt-16" />
      </section>

      <section class="panel panel-results">
        <ResultsView v-if="exerciseStore.view === 'results'" />
        <div v-else class="placeholder">
          <p>Здесь появятся результаты после завершения упражнения</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore }     from './stores/auth.js'
import { useExerciseStore } from './stores/exercise.js'
import LoginView    from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import AdminPanel   from './views/AdminPanel.vue'
import CameraView   from './components/CameraView.vue'
import Controls     from './components/Controls.vue'
import ResultsView  from './components/ResultsView.vue'

const authStore     = useAuthStore()
const exerciseStore = useExerciseStore()
</script>

<style>
:root {
  --bg:      #0d1117;
  --surface: #161b22;
  --border:  #30363d;
  --text:    #e6edf3;
  --muted:   #8b949e;
  --accent:  #58a6ff;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.mt-16 { margin-top: 16px; }
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.header-center {
  font-size: 13px;
  color: var(--muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.username {
  font-size: 13px;
  color: var(--muted);
}

.btn-header {
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-admin {
  background: #2d1f6e;
  color: #a5a3f5;
}
.btn-admin:hover { background: #3d2d8a; }

.btn-logout {
  background: #21262d;
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-logout:hover { background: #30363d; }

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  padding: 20px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.panel {
  display: flex;
  flex-direction: column;
}

.panel-results {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  overflow-y: auto;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
  padding: 40px;
}

@media (max-width: 900px) {
  .app-main { grid-template-columns: 1fr; }
}
</style>
