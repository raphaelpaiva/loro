FROM node
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --verbose
COPY . /app/
CMD ["node","sorter.js"]