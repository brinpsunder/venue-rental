FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm install

COPY src ./src
RUN npm run build \
  && mkdir -p dist/proto \
  && cp src/proto/user.proto dist/proto/ \
  && cp src/proto/venue.proto dist/proto/

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3002
EXPOSE 50052

CMD ["node", "dist/main.js"]
