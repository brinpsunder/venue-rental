FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
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

EXPOSE 3003

CMD ["node", "dist/server.js"]
