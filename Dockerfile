FROM node:latest
RUN npm install -g taskcluster-vcs@2.0.0-alpha.14 --no-optional
ENTRYPOINT ["tc-vcs"]

