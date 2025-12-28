FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache gcompat=1.1.0-r4
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache libcap=2.77-r0 && \
    setcap 'cap_net_bind_service=+ep' /usr/local/bin/node && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /feedback && \
    chown nextjs:nodejs /feedback

ENV FEEDBACK_DIR=/feedback

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/build/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/build/static ./build/static

RUN printf "#!/bin/sh\n\
echo \"window.__ENV = {\" > /app/public/env-config.js\n\
env | grep \"^RUNTIME_\" | while read -r line; do\n\
  key=\$(echo \"\$line\" | cut -d \"=\" -f 1)\n\
  val=\$(echo \"\$line\" | cut -d \"=\" -f 2-)\n\
  echo \"  \\\"\$key\\\": \\\"\$val\\\",\" >> /app/public/env-config.js\n\
done\n\
echo \"}\" >> /app/public/env-config.js\n\
exec \"\$@\"\n" > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 80
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
