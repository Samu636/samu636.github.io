# How to Restore a Previous Commit

This guide explains different methods to restore your repository to a previous commit state.

## Understanding Your Current Situation

First, check your git history:
```bash
git log --oneline
```

## Methods to Restore Previous Commits

### Method 1: Git Reset (Rewrite History)

⚠️ **Warning**: This rewrites history. Only use if you haven't pushed or if you're sure about force pushing.

#### Soft Reset (Keep Changes Staged)
Moves HEAD to previous commit but keeps all changes staged:
```bash
git reset --soft HEAD~1
```

#### Mixed Reset (Keep Changes Unstaged) - DEFAULT
Moves HEAD to previous commit and unstages changes:
```bash
git reset HEAD~1
# or
git reset --mixed HEAD~1
```

#### Hard Reset (Discard All Changes)
Moves HEAD to previous commit and discards all changes:
```bash
git reset --hard HEAD~1
```

To reset to a specific commit:
```bash
git reset --hard <commit-hash>
# Example: git reset --hard 98ad780
```

### Method 2: Git Revert (Create New Commit)

✅ **Recommended** for shared branches - Creates a new commit that undoes changes.

Revert the last commit:
```bash
git revert HEAD
```

Revert a specific commit:
```bash
git revert <commit-hash>
```

### Method 3: Git Checkout (Temporary)

Temporarily view a previous commit without changing your branch:
```bash
git checkout <commit-hash>
```

To go back to your branch:
```bash
git checkout <branch-name>
```

## Example: Going Back to a Previous Commit

**Note**: The commit hashes below are examples. Use `git log --oneline` to find your actual commit hashes.

Let's say you want to go back from a recent commit to an earlier one:

**Option A: Hard reset (if you want to discard the recent commit)**
```bash
# Replace <previous-commit-hash> with your actual commit hash
git reset --hard <previous-commit-hash>
git push --force origin <branch-name>
```

**Option B: Revert (safer for shared branches)**
```bash
# Replace <unwanted-commit-hash> with the commit you want to undo
git revert <unwanted-commit-hash>
git push origin <branch-name>
```

## Common Scenarios

### Undo Last Commit But Keep Changes
```bash
git reset HEAD~1
```

### Undo Last Commit and Discard Changes
```bash
git reset --hard HEAD~1
```

### Undo Multiple Commits
```bash
git reset --hard HEAD~3  # Go back 3 commits
```

### Restore a Specific File from Previous Commit
```bash
git checkout <commit-hash> -- path/to/file
```

## After Force Push (if needed)

If you used `git reset --hard` and need to update remote:
```bash
git push --force origin <branch-name>
```

⚠️ **Warning**: Force push will overwrite remote history. Make sure no one else is working on this branch.

## Checking Changes Before Reset

Always check what will change before resetting:
```bash
git diff HEAD <commit-hash>
```

## Recovering from Mistakes

If you made a mistake, you can use reflog to recover:
```bash
git reflog
git reset --hard <commit-hash-from-reflog>
```

## Best Practices

1. **Always commit or stash** your work before using reset
2. **Use revert** instead of reset for shared branches
3. **Double-check** the commit hash before resetting
4. **Communicate** with your team before force pushing
5. **Use reflog** as a safety net if something goes wrong
