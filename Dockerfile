FROM node:latest

# Repo is unhappy unless we configure git...
RUN git config --global user.email "taskcluster-vcs@example.nomail" && \
    git config --global user.name "Taskcluster VCS"

RUN npm install -g taskcluster-vcs@2.3.14 --no-optional
ENTRYPOINT ["tc-vcs"]

