FROM node:latest
RUN npm install -g taskcluster-vcs --no-optional
COPY task.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
