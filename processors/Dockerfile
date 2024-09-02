FROM node:alpine3.19
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --verbose
COPY . /app/
CMD ["node","sorter.js"]