FROM nginx:alpine

RUN apk add --no-cache nodejs npm

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY server /app/server
WORKDIR /app/server
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY . /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
