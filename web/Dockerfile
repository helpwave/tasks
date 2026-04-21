ARG NODE_ALPINE_DIGEST="sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f"

FROM node:22-alpine@${NODE_ALPINE_DIGEST} AS base

FROM base AS deps
RUN apk add --no-cache \
    gcompat=1.1.0-r4 \
    libucontext=1.3.3-r0 \
    musl-obstack=1.2.3-r2
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

RUN apk add --no-cache \
    libcap=2.78-r0 \
    libcap-getcap=2.78-r0 \
    libcap-setcap=2.78-r0 \
    libcap-utils=2.78-r0 \
    libcap2=2.78-r0 && \
    setcap 'cap_net_bind_service=+ep' /usr/local/bin/node && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 tasks && \
    mkdir -p /feedback && \
    mkdir -p /profile && \
    chown tasks:nodejs /feedback && \
    chown tasks:nodejs /profile

ENV FEEDBACK_DIR=/feedback
ENV PROFILE_PICTURE_DIRECTORY=/profile

COPY --from=builder --chown=tasks:nodejs /app/public ./public
COPY --from=builder --chown=tasks:nodejs /app/build/standalone ./
COPY --from=builder --chown=tasks:nodejs /app/build/static ./build/static

RUN printf "#!/bin/sh\n\
echo \"window.__ENV = {\" > /app/public/env-config.js\n\
env | grep \"^RUNTIME_\" | while read -r line; do\n\
  key=\$(echo \"\$line\" | cut -d \"=\" -f 1)\n\
  val=\$(echo \"\$line\" | cut -d \"=\" -f 2-)\n\
  echo \"  \\\"\$key\\\": \\\"\$val\\\",\" >> /app/public/env-config.js\n\
done\n\
echo \"}\" >> /app/public/env-config.js\n\
exec \"\$@\"\n" > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER tasks
EXPOSE 80
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
