.PHONY: help infra-up infra-down infra-logs clean

help:
	@echo "SecureShare Management Commands:"
	@echo "  make infra-up    - Start PostgreSQL, Redis, RabbitMQ, and MinIO in background"
	@echo "  make infra-down  - Stop all running infrastructure containers"
	@echo "  make infra-logs  - View live logs of all infrastructure containers"
	@echo "  make clean       - Remove cache files and build artifacts"

infra-up:
	docker compose -f infra/docker-compose.yml up -d

infra-down:
	docker compose -f infra/docker-compose.yml down

infra-logs:
	docker compose -f infra/docker-compose.yml logs -f

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
