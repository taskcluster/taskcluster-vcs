#! /bin/bash -vex

test ! -e $TASK_ID
test ! -e $RUN_ID
test ! -e $URL

tc-vcs create-clone-cache --proxy --task-id $TASK_ID --run-id $RUN_ID $URL
