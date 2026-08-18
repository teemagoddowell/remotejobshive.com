# Step 1: Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Step 2: Install dependencies
COPY package*.json ./
RUN npm ci

# Step 3: Define build arguments for Next.js NEXT_PUBLIC_* variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAIN_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY

# Step 4: Export build args as environment variables so Next.js can read them during "npm run build"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MAIN_URL=$NEXT_PUBLIC_MAIN_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=$NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY

# Step 5: Copy application code and build
COPY . .
RUN npm run build

# Step 6: Production runner phase
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy standalone build output / assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8001

CMD ["npm", "run", "start", "--", "-p", "8001"]
