FROM ubuntu:16.04

RUN apt-get update && apt-get install -y mercurial git
RUN apt-get install -y curl
# Repo is unhappy unless we configure git...
RUN git config --global user.email "taskcluster-vcs@example.nomail" && \
    git config --global user.name "Taskcluster VCS" && \
    git config --global gc.auto 0

# Install node
RUN cd /usr/local/ && curl https://nodejs.org/dist/v0.12.4/node-v0.12.4-linux-x64.tar.gz | tar -xz --strip-components 1

RUN npm install -g taskcluster-vcs@2.3.42 --no-optional
ENTRYPOINT ["tc-vcs"]
