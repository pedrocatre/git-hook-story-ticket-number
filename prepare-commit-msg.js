#!/usr/bin/env node
/*
 * Automatically adds branch code and branch description to every commit message.
 */

const exec = require('child_process').exec,
    util = require('util'),
    fs = require('fs'),
    COMMAND_TO_GET_BRANCH_NAME = 'git branch | grep "*" | sed "s/* //"';

if (isPathToDefaultCommitMsgBeingPassedAsArg()) {
    exec(COMMAND_TO_GET_BRANCH_NAME,
        (err, stdout, stderr) => {
            if (err) {
                // git branch will fail if initial commit has not been done
                process.exit(0);
            }

            const originalDefaultCommitMsg = readContentOfDefaultCommitMsg(),
                branchName = trimExtraCharactersFromStartAndEndOfLine(stdout),
                tasksCode = getTasksCodeFromBranchName(branchName);

            exec(createCommandToGetBranchDescription(branchName),
                (err, stdout, stderr) => {
                    let description = getDescription(stdout);

                    if (isInABranch(branchName)) {
                        let newContents = createNewCommitMsg(originalDefaultCommitMsg, tasksCode, description);
                        writeContentToCommitMsgFile(newContents);
                        process.exit(0);
                    } else {
                        process.exit(0);
                    }
                });
        });
}

function isInABranch(branchName) {
    // "Not currently on any branch" means you have a detached head, i.e. your HEAD pointer is directly referencing a
    // commit instead of symbolically pointing at the name of a branch.
    // Read more here: http://stackoverflow.com/a/2498553/3094399
    return branchName !== '(no branch)';
}

function isPathToDefaultCommitMsgBeingPassedAsArg() {
    // path would be .git/COMMIT_EDITMSG
    return /COMMIT_EDITMSG/g.test(process.argv[2]);
}

function getDescription(stdout) {
    if (stdout) {
        return stdout.replace(/\n/g, '');
    }

    return '';
}

function createCommandToGetBranchDescription(branchName) {
    return 'git config branch.' + branchName + '.description';
}

function trimExtraCharactersFromStartAndEndOfLine(stdout) {
    return stdout.replace('* ', '').replace('\n', '');
}

/**
 * Return ann array containing 1 or 2 tasks code depending on the format of the branch name.
 * @param {string} branchName branch name whose format could be:
 *  - {type_of_branch}/{story_code}/{name_of_story}
 *  - {type_of_branch}/{story_code}/{subtask_code}/{name_of_subtask}
 *  - what you want
 */
function getTasksCodeFromBranchName(branchName) {
    const branchNameParts = branchName.split('/');
    if (branchNameParts.length == 3) {
        // Case with only one code (story code)
        return [branchNameParts[1]];
    }
    if (branchNameParts.length > 3) {
        // Case with 2 codes (story and subtask)
        return [branchNameParts[1], branchNameParts[2]];
    }

    return [];
}

function readContentOfDefaultCommitMsg() {
    // read content from .git/COMMIT_EDITMSG
    return fs.readFileSync(process.argv[2]);
}

function writeContentToCommitMsgFile(newContents) {
    // write contents back to .git/COMMIT_EDITMSG
    fs.writeFileSync(process.argv[2], newContents);
}

/**
 * If present, prepend to the commit message the task(s) code(s) written in the branch name.
 * @param {string} originalDefaultCommitMsg the orginal commit message
 * @param {array} tasksCode an array containing the tasks code written in the branch name
 * @param {string} description the description in the commit message
 */
function createNewCommitMsg(originalDefaultCommitMsg, tasksCode, description) {
    let newContents;
    let tasksCodesToPrepend = '';
    if (tasksCode.length >= 1) {
        const firstTaskCode = tasksCode[0];
        if (originalDefaultCommitMsg.indexOf("[" + firstTaskCode + "]") == -1) {
            tasksCodesToPrepend = util.format('[%s] ', firstTaskCode);
        }
        if (tasksCode.length >= 2) {
            const secondTaskCode = tasksCode[1];
            if (originalDefaultCommitMsg.indexOf("[" + secondTaskCode + "]") == -1) {
                tasksCodesToPrepend = util.format('%s[%s] ', tasksCodesToPrepend, secondTaskCode);
            }
        }
    }
    
    if (tasksCodesToPrepend == '') {
        return originalDefaultCommitMsg;
    }

    newContents = util.format('%s%s', tasksCodesToPrepend, originalDefaultCommitMsg);

    if (description) {
        newContents = util.format('%s\n\n%s', newContents, description);
    }
    return newContents;
}
