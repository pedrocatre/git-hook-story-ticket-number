# git-hook-story-ticket-number
git hook to add branch code to commit message

Automatically adds story code from the branch name and branch description to every commit message.

Example: **[API-123] my commit**

## Why is this useful?
I'm working on projects where the team follows a branch naming convention that includes the ticket code/number of the task the branch refers to. We have a JIRA and bitbucket configuration that links the commits and the tasks as long as we include the task code/number in the commit.

Main advantage would be that it is easy to see what tasks/stories are being released and what is their state and if there is any prerequisite before release.

Having this automated is important so we don't waste time filling out this code on every commit message and so we don't get it wrong when switching between branches we are working on.

## Branch naming convention

### One issue code

Since the story code is taken from the branch name we assume the following convention for the branch naming:

**{type_of_branch}/{story_code}/{name_of_story}**

for example from branch name:

**feature/API-34193/edit-refund-role**

we get:

**[API-34193] my commit message**

If you are in the develop branch and you commit the commit message will look like:

**[develop] my commit message**

### Two issue codes

If subtasks are used, the naming convention for branch name can be:

**{type_of_branch}/{story_code}/{subtask_code}/{name_of_subtask}**

for example from branch name:

**subtask/API-34193/API-34194/edit-refund-role-part-one**

we get:

**[API-34193] [API-34194] my commit message**

### No issue codes

If the branch name doesn't contain any code, the commit message won't be modified.

## Dependencies

This hook needs nodejs to run.

## Installing the hook

You need to have [nodejs](https://nodejs.org/en/) installed.

- Add the prepare-commit-msg.js file to the .git/hooks subdirectory of your project.
- Make the hook file executable: ```chmod +x .git/hooks/prepare-commit-msg.js```
