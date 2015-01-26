#! /bin/bash -vex

test ! -e $TASK_ID # supplied by the docker-worker environment
test ! -e $RUN_ID # supplied by the docker-worker environment
test ! -e $1 # url to donwload...

tc-vcs create-clone-cache --proxy --task-id $TASK_ID --run-id $RUN_ID $1
