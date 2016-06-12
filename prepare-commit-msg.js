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
                taskCode = getTaskCodeFromBranchName(branchName);

            exec(createCommandToGetBranchDescription(branchName),
                (err, stdout, stderr) => {
                    let description = getDescription(stdout);

                    if (isInABranch(branchName)) {
                        let newContents = createNewCommitMsg(originalDefaultCommitMsg, taskCode, description);
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

function getTaskCodeFromBranchName(branchName) {
    const branchNameParts = branchName.split('/');
    if (branchNameParts.length >= 2) {
        return branchNameParts[1];
    }

    return '';
}

function readContentOfDefaultCommitMsg() {
    // read content from .git/COMMIT_EDITMSG
    return fs.readFileSync(process.argv[2]);
}

function writeContentToCommitMsgFile(newContents) {
    // write contents back to .git/COMMIT_EDITMSG
    fs.writeFileSync(process.argv[2], newContents);
}

function createNewCommitMsg(originalDefaultCommitMsg, taskCode, description) {
    let newContents = util.format('[%s] %s', taskCode, originalDefaultCommitMsg);
    if (description) {

        newContents = util.format('%s\n\n%s', newContents, description);
    }

    return newContents;
}
