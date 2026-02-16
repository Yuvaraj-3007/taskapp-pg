# ============================================
# Dockerfile - Task Manager API (PostgreSQL)
# Author: Yuvaraj Pandian
# ============================================

# Step 1: Use Node.js Alpine (small image ~50MB)
FROM node:20-alpine

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package.json first (Docker caches this layer)
COPY package.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy application code
COPY app.js ./

# Step 6: App runs on port 3000
EXPOSE 3000

# Step 7: Start the app
CMD ["npm", "start"]
