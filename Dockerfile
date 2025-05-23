FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

RUN npm install -f

COPY . .

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production -f

COPY --from=development /app/dist ./dist

CMD ["node", "/app/dist/main.js"]