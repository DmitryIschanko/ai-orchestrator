.PHONY: help setup start stop restart logs migrate seed clean build

help: ## Показать помощь
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Первоначальная настройка
	@echo "🚀 Настройка AI Company Orchestrator..."
	cp .env.example .env
	@echo "⚠️  Отредактируйте .env файл перед запуском!"

start: ## Запустить все сервисы
	@echo "🚀 Запуск сервисов..."
	docker compose up -d
	@echo "✅ Сервисы запущены!"
	@echo "🌐 Откройте: http://localhost:8080"

start-build: ## Запустить с пересборкой
	@echo "🏗️  Пересборка и запуск..."
	docker compose up -d --build

stop: ## Остановить все сервисы
	@echo "🛑 Остановка сервисов..."
	docker compose down

restart: ## Перезапустить сервисы
	@echo "🔄 Перезапуск..."
	docker compose restart

logs: ## Показать логи всех сервисов
	docker compose logs -f

logs-backend: ## Логи backend
	docker compose logs -f backend

logs-frontend: ## Логи frontend
	docker compose logs -f frontend

migrate: ## Применить миграции базы данных
	@echo "🗄️  Применение миграций..."
	docker compose exec backend npx prisma migrate dev

migrate-prod: ## Применить миграции (production)
	docker compose exec backend npx prisma migrate deploy

seed: ## Создать admin пользователя
	@echo "👤 Создание admin..."
	docker compose exec backend npm run seed:admin

studio: ## Открыть Prisma Studio (GUI для БД)
	@echo "🎨 Открытие Prisma Studio..."
	docker compose exec backend npx prisma studio

clean: ## Очистка (удалить volumes)
	@echo "🧹 Очистка..."
	docker compose down -v
	docker system prune -f

build: ## Пересобрать образы
	@echo "🏗️  Пересборка образов..."
	docker compose build --no-cache

status: ## Статус сервисов
	@echo "📊 Статус сервисов:"
	docker compose ps

shell-backend: ## Shell в backend контейнер
	docker compose exec backend sh

shell-db: ## Shell в PostgreSQL
	docker compose exec postgres psql -U postgres -d ai_orchestrator
