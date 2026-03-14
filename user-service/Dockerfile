FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build && mkdir -p dist/infrastructure/grpc && cp src/infrastructure/grpc/user.proto dist/infrastructure/grpc/

FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 3001
EXPOSE 50051

CMD ["node", "dist/server.js"]
