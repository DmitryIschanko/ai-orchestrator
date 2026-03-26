# AI Orchestrator - Подробное описание функционала

## 📋 Содержание
1. [Аутентификация и авторизация](#1-аутентификация-и-авторизация)
2. [Управление организацией](#2-управление-организацией)
3. [Система целей (Goals)](#3-система-целей-goals)
4. [Тикеты и Kanban](#4-тикеты-и-kanban)
5. [AI Агенты](#5-ai-агенты)
6. [Бюджеты](#6-бюджеты)
7. [Файловое хранилище](#7-файловое-хранилище)
8. [Система навыков (Skills)](#8-система-навыков-skills)
9. [Workflow согласований](#9-workflow-согласований)
10. [Audit Log](#10-audit-log)
11. [LLM Провайдеры](#11-llm-провайдеры)
12. [Real-time обновления](#12-real-time-обновления)
13. [Интеграции каналов](#13-интеграции-каналов)
14. [Инфраструктура](#14-инфраструктура)

---

## 1. Аутентификация и авторизация

### Возможности:
- **Регистрация компаний** - Создание новой организации с автоматическим созданием admin пользователя
- **JWT аутентификация** - Access token (15 мин) + Refresh token (7 дней)
- **Роли пользователей** - admin, manager, user
- **Сброс пароля** - Через email с токеном (24 часа)
- **Защита API** - Все endpoints защищены middleware

### API Endpoints:
```
POST /api/auth/register       - Регистрация
POST /api/auth/login          - Вход
POST /api/auth/refresh        - Обновление токена
POST /api/auth/logout         - Выход
POST /api/auth/forgot-password - Запрос сброса
POST /api/auth/reset-password  - Установка нового пароля
GET  /api/auth/me             - Текущий пользователь
```

---

## 2. Управление организацией

### Возможности:
- **Профиль компании** - Название, миссия, slug
- **Пользователи** - CRUD операции, назначение ролей
- **Оргструктура** - Иерархия отделов и команд
- **Настройки** - JSON-поле для кастомных настроек

### Оргструктура:
```
Company
├── OrgNode (Department)
│   ├── OrgNode (Team)
│   │   └── Users
│   └── Users
└── Users
```

---

## 3. Система целей (Goals)

### Возможности:
- **Иерархия целей** - Компания → Департаменты → Команды → Сотрудники
- **OKR методология** - Objectives and Key Results
- **Прогресс** - Процент выполнения с автоматическим расчетом
- **Сроки** - Start date, end date, deadline tracking
- **Ответственные** - Назначение владельцев целей

### Поля цели:
- title, description, status (active/completed/cancelled)
- progress (0-100%)
- parentId (для иерархии)
- ownerId, orgNodeId
- startDate, endDate

---

## 4. Тикеты и Kanban

### Возможности:
- **Kanban доска** - Drag-and-drop между колонками
- **Статусы** - todo, in_progress, review, done, cancelled
- **Назначение** - На пользователей или AI агентов
- **Приоритеты** - low, medium, high, critical
- **Дедлайны** - С уведомлениями
- **Комментарии** - Обсуждение внутри тикета
- **История** - Audit trail изменений

### Kanban колонки:
1. **Backlog** - Все новые тикеты
2. **Todo** - Запланированные
3. **In Progress** - В работе
4. **Review** - На проверке
5. **Done** - Выполненные

---

## 5. AI Агенты

### Возможности:
- **Docker-like UI** - Карточки агентов как контейнеры
- **Статусы** - idle, busy, error, offline
- **Heartbeat** - Автоматическая проверка живости
- **Навыки** - Привязка skills к агентам
- **Логи** - История выполнения задач
- **Gateway интеграция** - WebSocket соединение с OpenClaw

### Поля агента:
- name, description, status
- dockerImage, version
- lastHeartbeat
- skills[]
- companyId

---

## 6. Бюджеты

### Возможности:
- **Категории** - Распределение по статьям расходов
- **Периоды** - Месячный, квартальный, годовой учет
- **Лимиты** - Установка budget limit
- **Отслеживание** - Факт vs План
- **Аналитика** - Графики и отчеты

### Структура бюджета:
```
Budget (2024-Q1)
├── Category "Development" - $50,000
│   ├── Spent: $32,500
│   └── Remaining: $17,500
├── Category "Marketing" - $20,000
│   ├── Spent: $15,000
│   └── Remaining: $5,000
└── Total: $70,000 / $70,000
```

---

## 7. Файловое хранилище

### Возможности:
- **Загрузка файлов** - Drag & drop
- **Типы** - Документы, изображения, код
- **Права доступа** - По ролям и организациям
- **Версионирование** - История изменений
- **Поиск** - По имени и метаданным

---

## 8. Система навыков (Skills)

### Возможности:
- **Определение навыков** - Название, описание, категория
- **Привязка к агентам** - Многие-ко-многим
- **Уровни** - junior, middle, senior, expert
- **Валидация** - Проверка перед назначением задачи

### Примеры навыков:
- code_generation (Python, JavaScript, etc.)
- code_review
- documentation
- testing
- devops
- data_analysis

---

## 9. Workflow согласований

### Возможности:
- **Создание запросов** - На действия требующие подтверждения
- **Статусы** - pending, approved, rejected
- **Уведомления** - Email + WebSocket + Telegram
- **Комментарии** - Причина отклонения
- **История** - Кто и когда принял решение

### Типы запросов:
- budget_override - Превышение бюджета
- access_request - Запрос доступа
- deployment - Деплой в прод
- data_access - Доступ к данным

### Уведомления:
```
Email → WebSocket (real-time) → Telegram (опционально)
```

---

## 10. Audit Log

### Возможности:
- **Полное логирование** - Все действия пользователей
- **Фильтры** - По пользователю, действию, дате
- **Экспорт** - CSV, JSON
- **Детализация** - Что изменилось (before/after)

### Логируемые действия:
- user.login, user.logout
- ticket.create, ticket.update, ticket.delete
- goal.create, goal.update
- budget.allocate, budget.spend
- approval.request, approval.approve, approval.reject
- agent.deploy, agent.stop
- file.upload, file.download

---

## 11. LLM Провайдеры

### Возможности:
- **Управление ключами** - Хранение API ключей (шифрование)
- **Провайдеры** - Claude, GPT, Gemini, Kimi
- **Ротация** - Primary / Fallback
- **Мониторинг** - Usage tracking
- **Лимиты** - Rate limiting, quota management

### Поддерживаемые провайдеры:
| Провайдер | Модели | Статус |
|-----------|--------|--------|
| Anthropic Claude | claude-3-opus, claude-3-sonnet | ✅ |
| OpenAI GPT | gpt-4, gpt-4-turbo, gpt-3.5 | ✅ |
| Google Gemini | gemini-pro, gemini-ultra | ✅ |
| Moonshot Kimi | kimi-chat | ✅ |

---

## 12. Real-time обновления

### Возможности:
- **WebSocket** - Socket.io сервер
- **Комнаты** - По companyId (изоляция данных)
- **JWT аутентификация** - Только для авторизованных
- **События** - ticket.update, approval.new, agent.status

### События WebSocket:
```typescript
// Client joins room by companyId
socket.join(companyId);

// Server emits events
io.to(companyId).emit("ticket:created", ticket);
io.to(companyId).emit("approval:requested", approval);
io.to(companyId).emit("agent:status", { agentId, status });
```

---

## 13. Интеграции каналов

### Telegram Bot

#### Возможности:
- **Уведомления** - О новых тикетах, согласованиях
- **Команды** - /status, /tasks, /approve
- **Webhook** - Прием сообщений от пользователей
- **Настройка** - Через UI (Bot Token, Chat ID)

#### API Endpoints:
```
POST /api/channels/telegram/setup   - Настройка бота
POST /api/channels/telegram/test    - Тест сообщения
```

### Планируемые интеграции:
- **Discord** - Бот для каналов
- **Slack** - Incoming webhooks
- **Email** - SMTP интеграция

---

## 14. Инфраструктура

### Nginx Reverse Proxy

#### Конфигурация:
```
Port 80 (HTTP)
├── /          → Frontend :8080
├── /api       → Backend :3000
└── /socket.io → Backend :3000 (WebSocket)
```

### Docker Compose

#### Сервисы:
- **db** - PostgreSQL 16 (порт 5432)
- **redis** - Redis 7 (порт 6379)
- **backend** - Node.js API
- **frontend** - React UI
- **nginx** - Reverse proxy (порт 80)

#### Health Checks:
- PostgreSQL: pg_isready
- Redis: redis-cli ping
- Backend: HTTP /health

### Мониторинг

#### Метрики:
- Gateway heartbeat (каждые 30 сек)
- API response time
- Database connection pool
- Redis memory usage

---

## 📊 Технические характеристики

### Производительность:
- **Backend:** ~1000 req/sec (без кэша)
- **WebSocket:** ~10k concurrent connections
- **Database:** 100+ connections pool

### Безопасность:
- JWT + Refresh tokens
- bcrypt password hashing (10 rounds)
- AES-256 encryption для sensitive data
- Rate limiting: 100 req/min per IP
- Helmet security headers
- CORS защита

---

## 🎯 Use Cases

### 1. Автоматизация разработки
- AI агенты генерируют код по тикетам
- Code review автоматизация
- Deployment pipeline

### 2. Управление проектами
- OKR цели компании
- Kanban трекинг задач
- Budget planning

### 3. AI Operations (AIOps)
- Мониторинг систем
- Автоматическое масштабирование
- Incident response

---

## 🔄 Roadmap

### v1.1 (планируется)
- [ ] Email notifications (SMTP)
- [ ] Slack integration
- [ ] Calendar integration
- [ ] Advanced analytics dashboard

### v1.2 (планируется)
- [ ] Mobile app (React Native)
- [ ] Voice commands
- [ ] AI-powered insights
- [ ] Multi-tenancy improvements

---

*Последнее обновление: 26.03.2026*
