<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">🎯 Стрелок</div>
      <h2 class="auth-title">Регистрация</h2>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="field">
          <label>Логин <span class="hint">(минимум 3 символа)</span></label>
          <input v-model="username" type="text" autocomplete="username" placeholder="Придумайте логин" />
        </div>
        <div class="field">
          <label>Пароль <span class="hint">(минимум 4 символа)</span></label>
          <input v-model="password" type="password" autocomplete="new-password" placeholder="Придумайте пароль" />
        </div>
        <div class="field">
          <label>Повторите пароль</label>
          <input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="Повторите пароль" />
        </div>

        <div v-if="error" class="auth-error">{{ error }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p class="auth-switch">
        Уже есть аккаунт?
        <button class="link-btn" @click="authStore.setPage('login')">Войти</button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore       = useAuthStore()
const username        = ref('')
const password        = ref('')
const confirmPassword = ref('')
const loading         = ref(false)
const error           = ref(null)

async function handleRegister() {
  error.value = null
  if (!username.value || !password.value || !confirmPassword.value) {
    error.value = 'Заполните все поля'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают'
    return
  }

  loading.value = true
  try {
    await authStore.register(username.value, password.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1117;
}

.auth-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 40px 36px;
  width: 100%;
  max-width: 380px;
}

.auth-logo {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
  color: #e6edf3;
}

.auth-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  color: #e6edf3;
  margin: 0 0 28px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  color: #8b949e;
}

.hint {
  color: #6e7681;
  font-size: 11px;
}

.field input {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 9px 12px;
  color: #e6edf3;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus {
  border-color: #58a6ff;
}

.auth-error {
  background: #3d1515;
  border: 1px solid #f85149;
  color: #ffa198;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.btn-primary {
  background: #1f6feb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}

.btn-primary:hover:not(:disabled) { background: #388bfd; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.auth-switch {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #8b949e;
}

.link-btn {
  background: none;
  border: none;
  color: #58a6ff;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  text-decoration: underline;
}

.link-btn:hover { color: #79c0ff; }
</style>
