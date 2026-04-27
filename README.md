# Стрелок — Веб-система анализа попаданий

## Требования

- Node.js 20+
- PostgreSQL 14+

---

## Быстрый старт

### 1. База данных

```bash
# Создать БД (заменить <user> на своего пользователя PostgreSQL)
psql -U <user> -d postgres -c "CREATE DATABASE strelok;"
```

### 2. Backend

```bash
cd backend
npm install

# Отредактировать DB_USER под своего пользователя PostgreSQL
nano .env

# Запуск (схема и тестовые пользователи создаются автоматически)
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173

---

## Тестовые аккаунты

| Логин | Пароль | Роль  |
|-------|--------|-------|
| Admin | Admin  | admin |
| User  | User   | user  |

---

## Переменные окружения (backend/.env)

| Переменная    | По умолчанию              | Описание               |
|---------------|---------------------------|------------------------|
| PORT          | 3000                      | Порт HTTP/WS сервера   |
| DB_HOST       | localhost                 | Хост PostgreSQL        |
| DB_PORT       | 5432                      | Порт PostgreSQL        |
| DB_NAME       | strelok                   | Имя базы данных        |
| DB_USER       | p0dsolyam1                | Пользователь БД        |
| DB_PASSWORD   | (пусто)                   | Пароль БД              |
| JWT_SECRET    | strelok-jwt-secret-2026   | Секрет для JWT-токенов |

---

## API

### Аутентификация

| Метод | Путь                  | Описание                        |
|-------|-----------------------|---------------------------------|
| POST  | /api/auth/login       | Вход (возвращает JWT)           |
| POST  | /api/auth/register    | Регистрация (роль user)         |

Все остальные маршруты требуют заголовок:
```
Authorization: Bearer <token>
```

### Упражнения (требует авторизации)

| Метод  | Путь                       | Описание                                      |
|--------|----------------------------|-----------------------------------------------|
| GET    | /api/exercises             | Список своих упражнений (с hit_count)         |
| GET    | /api/exercises/:id         | Упражнение с массивом попаданий               |
| POST   | /api/exercises             | Создать упражнение                            |
| PUT    | /api/exercises/:id/finish  | Завершить упражнение                          |
| DELETE | /api/exercises/:id         | Удалить своё упражнение                       |

### Администратор (роль admin)

| Метод  | Путь                          | Описание                      |
|--------|-------------------------------|-------------------------------|
| GET    | /api/admin/users              | Список пользователей          |
| POST   | /api/admin/users              | Создать пользователя          |
| DELETE | /api/admin/users/:id          | Удалить пользователя          |
| GET    | /api/admin/exercise-types     | Список видов упражнений       |
| POST   | /api/admin/exercise-types     | Добавить вид упражнения       |
| DELETE | /api/admin/exercise-types/:id | Удалить вид упражнения        |

### WebSocket `ws://localhost:3000/ws`

**Клиент → Сервер:**
```json
{
  "type": "frame",
  "data": "<base64-jpeg>",
  "exerciseId": 1,
  "offset": { "x": 0, "y": 0 }
}
```

**Сервер → Клиент:**
```json
{ "type": "hits", "hits": [{"x": 320.5, "y": 240.1}], "exerciseId": 1 }
{ "type": "error", "message": "описание ошибки" }
```

---

## Схема базы данных

```
users           — пользователи (username, password_hash, role)
exercise_types  — виды упражнений (управляются admin)
exercises       — упражнения (user_id, type_id, started_at, finished_at)
hits            — попадания (exercise_id, x, y, timestamp)
```

---

## Структура проекта

```
web-strelok/
├── frontend/
│   └── src/
│       ├── App.vue                    # Роутинг по страницам (login/register/profile/admin/app)
│       ├── main.js
│       ├── views/
│       │   ├── LoginView.vue          # Страница входа
│       │   ├── RegisterView.vue       # Страница регистрации
│       │   ├── ProfileView.vue        # Профиль: история упражнений, удаление
│       │   └── AdminPanel.vue         # Панель admin: пользователи, виды упражнений
│       ├── components/
│       │   ├── CameraView.vue         # Видеопоток, WS, калибровка, оверлей
│       │   ├── Controls.vue           # Кнопки Начать / Завершить / Новое
│       │   ├── HitsOverlay.vue        # Canvas-оверлей попаданий поверх видео
│       │   ├── ResultsView.vue        # Итоги текущего упражнения
│       │   ├── TargetCalibration.vue  # Разметка 4 углов мишени
│       │   └── TargetCanvas.vue       # Переиспользуемый canvas с мишенью и попаданиями
│       ├── composables/
│       │   ├── useCamera.js           # getUserMedia, snapshot 5fps
│       │   └── useWebSocket.js        # WS-клиент с автопереподключением
│       ├── stores/
│       │   ├── auth.js                # Pinia: токен, пользователь, страница, login/logout
│       │   └── exercise.js            # Pinia: состояние упражнения, попадания, калибровка
│       ├── services/
│       │   └── imageProcessor.js      # Обрезка кадра по мишени, возврат offset
│       └── utils/
│           ├── api.js                 # authFetch — fetch с Bearer-токеном
│           └── geometry.js            # getBoundingBox — общая утилита для canvas
└── backend/
    └── src/
        ├── index.js                   # Entry point: Express + WS + DB init + seed
        ├── middleware/
        │   └── auth.js                # requireAuth / requireAdmin (JWT)
        ├── routes/
        │   ├── auth.js                # POST /login, /register
        │   ├── exercises.js           # CRUD упражнений (защищено)
        │   ├── hits.js                # GET попаданий
        │   └── admin.js               # Управление пользователями и видами упражнений
        ├── services/
        │   ├── aiService.js           # Mock AI → POST /ai/detect (заменить на реальный)
        │   ├── dbService.js           # Запросы к PostgreSQL
        │   └── hitsFilter.js          # Дедупликация попаданий (MIN_DISTANCE / TIME_WINDOW)
        ├── websocket/
        │   └── handler.js             # кадр → AI → фильтр → БД → ответ клиенту
        └── db/
            ├── pool.js                # Пул соединений pg
            ├── init.js                # Запуск schema.sql при старте
            ├── seed.js                # Тестовые пользователи Admin / User
            └── schema.sql             # DDL: users, exercise_types, exercises, hits
```

---

## Замена Mock AI на реальный

Откройте [backend/src/services/aiService.js](backend/src/services/aiService.js)
и замените функцию `detectHits`:

```js
export async function detectHits(base64Image) {
  const res = await fetch('https://your-ai-api.com/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  })
  return res.json() // ожидается { hits: [{x, y}] }
}
```
