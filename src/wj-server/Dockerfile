FROM node

# Create App Directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install Dependencies
COPY package.json yarn.lock ./

RUN yarn install

# Copy app source code
COPY . .

# Exports
EXPOSE 5000

CMD ["npm", "run", "start:dev"]