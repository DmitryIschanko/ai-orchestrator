# Комплексный план тестирования AI Orchestrator

## Phase 1: Infrastructure Testing
- [ ] Docker containers health
- [ ] Network connectivity
- [ ] Port accessibility
- [ ] Volume mounts
- [ ] Environment variables

## Phase 2: Database Testing
- [ ] Connection pool
- [ ] Migration status
- [ ] Data integrity
- [ ] Foreign keys
- [ ] Indexes

## Phase 3: API Testing (All 11 endpoints)
- [ ] Auth (login, register, refresh, reset)
- [ ] Goals (CRUD, hierarchy)
- [ ] Tickets (CRUD, status change)
- [ ] Users (CRUD, roles)
- [ ] Budgets (CRUD, calculations)
- [ ] Approvals (workflow)
- [ ] Audit (filtering)
- [ ] Skills (CRUD)
- [ ] LLM (keys, chat)
- [ ] Agents (CRUD)
- [ ] Org (hierarchy)

## Phase 4: Security Testing
- [ ] JWT validation
- [ ] Unauthorized access
- [ ] SQL injection
- [ ] XSS protection
- [ ] Rate limiting
- [ ] CORS

## Phase 5: WebSocket Testing
- [ ] Connection
- [ ] Authentication
- [ ] Room isolation
- [ ] Events broadcasting

## Phase 6: Gateway Testing
- [ ] WebSocket connection
- [ ] Heartbeat
- [ ] Agent registration
- [ ] Command execution

## Phase 7: Integration Testing
- [ ] Full user flow
- [ ] Ticket lifecycle
- [ ] Approval workflow

## Phase 8: Frontend Testing
- [ ] Page loads
- [ ] Form submissions
- [ ] Navigation

## Phase 9: Performance
- [ ] Response time < 200ms
- [ ] Concurrent users
- [ ] Database queries

## Phase 10: Channels
- [ ] Telegram bot
- [ ] Webhook
