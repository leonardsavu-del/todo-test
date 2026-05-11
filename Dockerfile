FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev

FROM base AS test
COPY package.json ./
COPY src ./src
COPY test ./test
RUN node --test --experimental-test-coverage --test-coverage-include='src/**' test/

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
