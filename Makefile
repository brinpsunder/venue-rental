.PHONY: dev build down logs test install lint

dev:
	docker-compose up

build:
	docker-compose up --build

down:
	docker-compose down

down-volumes:
	docker-compose down -v

logs:
	docker-compose logs -f

logs-user:
	docker-compose logs -f user-service

test:
	cd user-service && npm test

install:
	cd user-service && npm install
	cd web-ui && npm install

get:
	cd user-service && npm install
	cd web-ui && npm install

dev-user:
	cd user-service && npm run dev

dev-ui:
	cd web-ui && npm run dev
