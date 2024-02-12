FROM node
WORKDIR /app
COPY . /app/
RUN apt update && apt install -y chromium
RUN npm install
CMD ["npm","start"]