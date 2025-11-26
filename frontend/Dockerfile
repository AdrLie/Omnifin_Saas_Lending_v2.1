# Omnifin Frontend Dockerfile (Expo/React Native Web)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install expo-cli globally
RUN npm install -g expo-cli

# Copy package.json and package-lock.json/yarn.lock
COPY package.json ./

# If you use yarn, uncomment below
# COPY yarn.lock ./
# RUN yarn install --frozen-lockfile

# If you use npm
RUN npm install

# Copy rest of the frontend project
COPY . ./

# Expose Expo default ports
EXPOSE 8081 19000 19001 19002

# Start Expo (web)
CMD ["npx", "expo", "start", "--web", "--non-interactive"]
