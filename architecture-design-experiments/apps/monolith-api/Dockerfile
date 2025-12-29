FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
