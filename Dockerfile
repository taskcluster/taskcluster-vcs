FROM node:latest
ADD . /app
WORKDIR /app
RUN npm install -g taskcluster-vcs
ENTRYPOINT ["/app/task.sh"]
