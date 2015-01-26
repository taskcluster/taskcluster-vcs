FROM node:latest
RUN npm install -g taskcluster-vcs --no-optional
ENTRYPOINT ["/app/task.sh"]
