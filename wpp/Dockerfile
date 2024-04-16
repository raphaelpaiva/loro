FROM node
RUN apt update && apt install -y chromium ffmpeg
WORKDIR /app
COPY package.json package-lock.json /app/
COPY . /app/
RUN npm install && npm run build
CMD ["npm","start"]