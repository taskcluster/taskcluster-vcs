FROM node:latest

# Repo is unhappy unless we configure git...
RUN git config --global user.email "you@example.com" && \
    git config --global user.name "Your Name"

RUN npm install -g taskcluster-vcs@2.0.0 --no-optional
ENTRYPOINT ["tc-vcs"]

