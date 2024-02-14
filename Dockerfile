FROM node
RUN apt update && apt install -y chromium ffmpeg
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
COPY ./loro_docker.json /app/loro.json
COPY dlmodel.js /app/
RUN node dlmodel.js
COPY . /app/
CMD ["npm","start"]