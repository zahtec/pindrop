FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 8080
# Remove the NODE_ENV variable for getting the CA Certificate
ENV NODE_ENV production
CMD ["node", "."]
