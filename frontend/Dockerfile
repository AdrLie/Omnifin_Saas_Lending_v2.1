# Omnifin Frontend Dockerfile (Expo/React Native Web)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (better caching)
COPY package.json ./
# COPY yarn.lock ./  <-- If you have this, uncomment it

# 1. Install dependencies locally (including expo)
RUN npm install --legacy-peer-deps

# 2. Copy the rest of the code
COPY . ./

# Expose ports
EXPOSE 8081 19000 19001 19002

# 3. Start using NPX (bypasses the global CLI warning)
CMD ["npx", "expo", "start", "--web", "--non-interactive", "--host", "0.0.0.0"]