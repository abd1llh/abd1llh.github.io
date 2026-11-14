FROM nginx:alpine

RUN apk add --no-cache nodejs npm

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY server /app/server
WORKDIR /app/server
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy ONLY the public site files into the web root. The full repo must
# never be web-accessible: `COPY .` also published the server source,
# supabase/schema.sql, docs/ and this Dockerfile as static downloads.
COPY index.html robots.txt sitemap.xml site.webmanifest /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY lang /usr/share/nginx/html/lang
COPY pages /usr/share/nginx/html/pages

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
