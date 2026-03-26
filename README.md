# AI Orchestrator Platform

Полноценная платформа для управления AI-агентами с микросервисной архитектурой.

## 🚀 Быстрый старт

```bash
# Клонирование
git clone <repo-url>
cd ai-orchestrator

# Запуск
docker compose up -d
```

**Доступ:** http://localhost (или ваш IP)

**Логин по умолчанию:** `admin@test.com` / `password123`

## 📋 Реализованный функционал

### Core Features ✅
- **Аутентификация** - JWT-based auth, регистрация, вход, сброс пароля
- **Организации** - Управление компаниями, оргструктура
- **Goal-driven** - Иерархия целей (компания → команды → сотрудники)
- **Тикеты** - Kanban доска с drag-and-drop
- **Агенты** - Управление AI-агентами с Docker-like UI
- **Бюджеты** - Финансовое планирование и отслеживание
- **Файлы** - Хранение и управление документами
- **Навыки (Skills)** - Система скиллов для агентов
- **Approval Workflow** - Согласование задач (approve/reject)
- **Audit Log** - Полное логирование действий с фильтрами
- **LLM Providers** - Управление ключами (Claude, GPT, Gemini, Kimi)
- **WebSocket** - Real-time обновления через Socket.io
- **Channel Integrations** - Telegram бот для уведомлений
- **Nginx Reverse Proxy** - Единая точка входа

### Тестирование ✅
- **Backend:** Jest + Supertest (8 тестов)
- **Frontend:** Cypress E2E

## 🏗 Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (80)                          │
│                   Reverse Proxy / Load Balancer             │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
     ┌────────▼────────┐            ┌────────▼────────┐
     │  Frontend:8080  │            │  Backend:3000   │
     │  React + Vite   │◄──────────►│  Express +      │
     │  TypeScript     │  REST/API  │  Prisma ORM    │
     └─────────────────┘            └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                       ┌──────▼──────┐┌─────▼─────┐┌───────▼────────┐
                       │ PostgreSQL  ││   Redis   ││ OpenClaw       │
                       │    :5432    ││   :6379   ││ Gateway:18789  │
                       └─────────────┘└───────────┘└────────────────┘
```

## 🛠 Технологический стек

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 20-alpine | Runtime |
| Express | 4.x | Web framework |
| TypeScript | 5.x | Language |
| Prisma | 5.22.0 | ORM |
| PostgreSQL | 16 | Database |
| Redis | 7 | Cache, Queues |
| Socket.io | 4.x | Real-time |
| JWT | - | Authentication |
| Bull | - | Job queues |

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18 | UI Library |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Language |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | - | Components |
| Monaco Editor | - | Code editor |
| Axios | - | HTTP client |

### Infrastructure
- **Docker + Docker Compose**
- **Nginx** reverse proxy
- **OpenClaw Gateway** (WebSocket агенты)

## 📁 Структура проекта

```
ai-orchestrator/
├── backend/
│   ├── src/
│   │   ├── __tests__/         # Jest тесты
│   │   ├── middleware/         # Auth, validation
│   │   ├── routes/             # API endpoints
│   │   │   └── channels/       # Telegram, Discord, Slack
│   │   ├── services/           # Business logic
│   │   │   └── channels/       # Notification services
│   │   └── utils/              # Helpers, logger
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   └── ui/             # shadcn/ui
│   │   ├── pages/              # Route pages
│   │   └── services/           # API clients
│   ├── cypress/                # E2E тесты
│   └── Dockerfile
├── nginx/
│   └── nginx.conf              # Reverse proxy
└── docker-compose.yml
```

## 🧪 Тестирование

### Backend (Jest + Supertest)
```bash
cd backend
npm install

# Run tests
npm test

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Результаты:** 8 тестов, все проходят ✅
- Password hashing
- JWT token generation
- Email validation
- Password validation
- Health check endpoint

### Frontend (Cypress)
```bash
cd frontend
npm install

# Open Cypress UI
npm run cypress:open

# Run headless
npm run cypress:run
```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-char-key
GATEWAY_URL=ws://localhost:18789
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
# Production build
docker compose up -d --build

# View logs
docker compose logs -f backend

# Update
git pull
docker compose up -d --build
```

### Manual Setup
```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npm run build
npm start

# Frontend
cd frontend
npm install
npm run build
npm run preview
```

## 📚 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/refresh` | Обновление токена |
| POST | `/api/auth/forgot-password` | Сброс пароля |
| POST | `/api/auth/reset-password` | Новый пароль |

### Core Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/goals` | Цели |
| GET/POST | `/api/tickets` | Тикеты |
| GET/POST | `/api/agents` | Агенты |
| GET/POST | `/api/budgets` | Бюджеты |
| GET/POST | `/api/approvals` | Согласования |
| GET/POST | `/api/audit-logs` | Логи |
| POST | `/api/channels/telegram/setup` | Настройка Telegram |
| POST | `/api/channels/telegram/test` | Тест Telegram |

### WebSocket
- `ws://host/socket.io` - Real-time updates (rooms by companyId)

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (Express Rate Limit)
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ SQL injection protection (Prisma ORM)
- ✅ Encryption for sensitive data

## 📈 Monitoring & Observability

- ✅ Audit logs for all actions
- ✅ Gateway heartbeat monitoring
- ✅ Docker health checks
- ✅ Nginx access logs
- ✅ Structured logging (Pino)

## 📝 Дополнительная документация

- [TESTING.md](./TESTING.md) - Руководство по тестированию
- [FEATURES.md](./FEATURES.md) - Подробное описание функционала
- [openclaw-knowledge-base.md](./openclaw-knowledge-base.md) - Технические детали

## 🤝 Contributing

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m Add amazing feature`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 License

MIT License

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [OpenClaw](https://github.com/openclaw) for Gateway integration
