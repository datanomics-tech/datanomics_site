FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p public/uploads && chown -R node:node public/uploads
USER node
EXPOSE 3000
CMD ["sh", "-c", "node scripts/db-setup.js && node server.js"]
