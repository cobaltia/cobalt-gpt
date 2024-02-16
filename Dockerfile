FROM node:18 as base

WORKDIR /cobaltgpt

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node .yarn/ .yarn/

FROM base as builder

COPY --chown=node:node tsconfig.base.json .
COPY --chown=node:node src/ src/

RUN yarn install --immutable
RUN yarn run build

FROM builder as runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps"

COPY .env ./.env

USER node

CMD ["yarn", "run", "start"]