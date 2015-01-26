FROM node:latest
ADD . /app
RUN cd /app && npm install && npm link
ENTRYPOINT ["/app/task.sh"]
