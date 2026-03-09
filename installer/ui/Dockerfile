FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host exposes Vite on 0.0.0.0 so it's reachable from outside the container
CMD ["npm", "run", "dev"]
