FROM node:24-alpine
WORKDIR /app
RUN npm install -g pnpm@10.24.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]