FROM node:20-alpine As builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build:shared
RUN npm run build:dashboard

# Stage 2: serve
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/website/browser /usr/share/nginx/html
EXPOSE 80
