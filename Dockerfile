ARG NODE_VERSION=16.15.1

FROM node:${NODE_VERSION}-alpine AS build

RUN apk add --no-cache \
    python3 g++ make zlib-dev
RUN ln -s /usr/bin/python3 /usr/bin/python

USER node

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm i

COPY --chown=node:node . .

RUN npm run build


FROM node:${NODE_VERSION}-alpine AS app

ENV NODE_ENV=production

RUN apk add --no-cache python3 ffmpeg
RUN ln -s /usr/bin/python3 /usr/bin/python

USER node

WORKDIR /app

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

CMD ["node", "dist/index.js"]
