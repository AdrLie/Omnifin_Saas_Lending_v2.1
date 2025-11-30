# syntax=docker/dockerfile:1
# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json /app/package.json
# Use npm install instead of ci because lockfile may not exist
RUN npm install

# Copy the rest of the app and build
COPY . /app

# Allow passing API base URL at build time for CRA
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

# Runtime stage (Nginx)
# FROM nginx:alpine AS runtime

# COPY nginx.conf /etc/nginx/conf.d/default.conf
# RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX_CONF'
# server {
# 	listen 3001;
# 	server_name _;
# }
# NGINX_CONF

# Copy built assets
# COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3001
CMD ["npm", "run", "start"]
