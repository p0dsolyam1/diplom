# Стрелок — Веб-система анализа попаданий

## Требования

- Node.js 20+
- PostgreSQL 14+

---

## Быстрый старт

### 1. База данных

```bash
# Создать БД
psql -U postgres -c "CREATE DATABASE strelok;"
```

### 2. Backend

```bash
cd backend

# Зависимости
npm install

# Конфиг (отредактировать при необходимости)
cp .env.example .env

# Запуск (схема создаётся автоматически при старте)
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

## Переменные окружения (backend/.env)

| Переменная    | По умолчанию | Описание             |
|---------------|--------------|----------------------|
| PORT          | 3000         | Порт HTTP/WS сервера |
| DB_HOST       | localhost    | Хост PostgreSQL      |
| DB_PORT       | 5432         | Порт PostgreSQL      |
| DB_NAME       | strelok      | Имя базы данных      |
| DB_USER       | postgres     | Пользователь БД      |
| DB_PASSWORD   | postgres     | Пароль БД            |

---

## API

### REST

| Метод | Путь                        | Описание                          |
|-------|-----------------------------|-----------------------------------|
| POST  | /api/exercises              | Создать упражнение                |
| GET   | /api/exercises              | Список упражнений                 |
| GET   | /api/exercises/:id          | Получить упражнение               |
| PUT   | /api/exercises/:id/finish   | Завершить упражнение              |
| GET   | /api/exercises/:id/hits     | Попадания упражнения              |

### WebSocket `ws://localhost:3000/ws`

**Клиент → Сервер:**
```json
{ "type": "frame", "data": "<base64-jpeg>", "exerciseId": 1 }
```

**Сервер → Клиент:**
```json
{ "type": "hits", "hits": [{"x": 320.5, "y": 240.1}], "exerciseId": 1 }
{ "type": "error", "message": "описание ошибки" }
```

---

## Структура проекта

```
web-strelok/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── App.vue          # Корневой компонент, layout
│       │   ├── CameraView.vue   # Видео + overlay + WS
│       │   ├── Controls.vue     # Кнопки Start/Stop
│       │   ├── HitsOverlay.vue  # Canvas поверх видео
│       │   └── ResultsView.vue  # Итоги, мишень, таблица
│       ├── composables/
│       │   ├── useCamera.js     # Камера, snapshot 5fps
│       │   └── useWebSocket.js  # WS клиент
│       └── stores/
│           └── exercise.js      # Pinia: состояние упражнения
└── backend/
    └── src/
        ├── routes/
        │   ├── exercises.js     # CRUD упражнений
        │   └── hits.js          # Попадания
        ├── services/
        │   ├── aiService.js     # Mock AI (заменить на реальный)
        │   └── dbService.js     # Работа с PostgreSQL
        ├── websocket/
        │   └── handler.js       # WS: кадр → AI → БД → ответ
        ├── db/
        │   ├── pool.js          # Пул соединений pg
        │   ├── init.js          # Инициализация схемы
        │   └── schema.sql       # DDL таблиц
        └── index.js             # Entry point
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
