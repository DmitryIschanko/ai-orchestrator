FROM node:20-alpine

# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl libssl3

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
