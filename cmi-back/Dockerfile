# Stage 1: build the Angular frontend.
FROM node:18 AS frontend-build
WORKDIR /front
COPY cmi-front/package*.json ./
RUN npm install --legacy-peer-deps
COPY cmi-front/ ./
RUN npm run build

# Stage 2: backend (Node + Express) with the Angular bundle baked in.
FROM node:18
WORKDIR /app
COPY cmi-back/package*.json ./
RUN npm install --legacy-peer-deps
COPY cmi-back/ ./
COPY --from=frontend-build /front/dist/cmi-front ./public
EXPOSE 4000
CMD ["npm", "start"]
