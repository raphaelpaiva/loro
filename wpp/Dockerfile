FROM node:alpine3.19
RUN apk update && \
    apk upgrade && \
    apk add --no-cache ffmpeg && \
    apk add --no-cache chromium --repository=http://dl-cdn.alpinelinux.org/alpine/v3.10/main

WORKDIR /app
COPY package.json package-lock.json /app/
COPY . /app/
RUN npm update @wppconnect-team/wppconnect && \
    npm install && \
    npm run build
CMD ["npm","start"]