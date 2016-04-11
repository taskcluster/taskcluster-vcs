FROM node:0.12.4

# Repo is unhappy unless we configure git...
RUN git config --global user.email "taskcluster-vcs@example.nomail" && \
    git config --global user.name "Taskcluster VCS" && \
    git config --global gc.auto 0

RUN npm install -g taskcluster-vcs@2.3.30 --no-optional
ENTRYPOINT ["tc-vcs"]

