FROM node:23 as base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@10.1.0 --activate

WORKDIR /cobaltgpt

COPY --chown=node:node pnpm-lock.yaml .
COPY --chown=node:node package.json .

FROM base as builder

COPY --chown=node:node tsconfig.base.json .
COPY --chown=node:node src/ src/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM builder as runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps"

COPY .env ./.env

USER node

CMD ["pnpm", "run", "start"]