FROM node:20-alpine As builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build:shared
RUN npm run build:dashboard

#nginx
RUN nginx
Expose 80
COPY nginx/deafault.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/builder /user/share/nginx/html
