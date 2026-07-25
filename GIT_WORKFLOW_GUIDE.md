# Git Development Workflow Guide

## Overview
This document outlines the Git workflow to ensure the repository remains in sync with the latest changes at all times.

---

## Workflow Steps

### 1. Before Starting Any Work
```bash
# Pull latest changes from remote
git pull origin main

# Check current branch
git branch

# Check status
git status
```

### 2. During Development
- Make changes to code
- Test changes locally
- Verify functionality works

### 3. Pre-Commit Verification Checklist

Before committing any changes, verify:

#### Application Health
- [ ] Backend is running without errors
  ```bash
  curl http://192.168.20.180:5000/api/health
  ```
  
- [ ] Frontend builds successfully
  ```bash
  cd frontend
  npm run build
  ```

- [ ] No compilation errors in code

- [ ] No linting errors (if applicable)
  ```bash
  # If using eslint
  cd frontend
  npm run lint
  ```

#### Functionality Verification
- [ ] New feature works correctly
- [ ] Existing functionality not broken
- [ ] All user roles tested (Admin, Standard User, Viewer)
- [ ] No console errors in browser (F12)
- [ ] No backend errors in logs

#### Test Coverage (if applicable)
- [ ] All tests pass
  ```bash
  pytest  # or your test command
  ```

### 4. Committing Changes

#### Stage Relevant Files
```bash
# Stage specific files (recommended)
git add path/to/file1.py path/to/file2.js

# Or stage all changes (use with caution)
git add .
```

#### Exclude Non-Essential Files
Do NOT commit:
- Log files (`*.log`)
- Build artifacts (`frontend/build/*`)
- Environment files (`.env`)
- Database files (`*.db`)
- Temporary files (`*.tmp`, `*.swp`)
- Test files (unless part of test suite)
- Documentation files meant for local development only

#### Write Clear Commit Messages
```bash
git commit -m "Clear, descriptive commit message

FEATURES:
- List new features added

CHANGES:
- List changes made

FIXES:
- List bugs fixed

VERIFIED:
- List what was tested"
```

**Good Commit Message Examples:**
- ✅ `Fix asset bulk deletion for Standard Users`
- ✅ `Add PDF generation for asset assignment forms`
- ✅ `Restrict Viewer User permissions on Settings section`
- ✅ `Implement RBAC for employee management endpoints`

**Bad Commit Message Examples:**
- ❌ `update`
- ❌ `fix`
- ❌ `changes`
- ❌ `WIP`

### 5. Pushing to Remote

#### Check Remote Status
```bash
# View remote repository
git remote -v

# Check if there are any incoming changes
git fetch
git status
```

#### Push Changes
```bash
# Push to main branch
git push origin main

# If push is rejected due to remote changes
git pull --rebase origin main
git push origin main
```

#### Verify Push Success
```bash
# Check that local and remote are synced
git status

# Should show: "Your branch is up to date with 'origin/main'"
```

### 6. Handling Conflicts

If you encounter merge conflicts:

```bash
# Pull with rebase
git pull --rebase origin main

# Fix conflicts in files (marked with <<<<<<, =======, >>>>>>>)

# After fixing, stage the resolved files
git add path/to/resolved/file.py

# Continue rebase
git rebase --continue

# Push changes
git push origin main
```

---

## Complete Workflow Example

```bash
# 1. Pull latest changes
git pull origin main

# 2. Make your changes
# ... edit files ...

# 3. Test changes
curl http://192.168.20.180:5000/api/health
cd frontend && npm run build

# 4. Check what changed
git status
git diff

# 5. Stage changes
git add api_server.py utils/auth.py frontend/src/App.js
git add FEATURE_DOCUMENTATION.md

# 6. Commit with clear message
git commit -m "Implement user role-based access control

FEATURES:
- Add RBAC for Settings section
- Restrict access to Admin users only

BACKEND:
- Add @admin_required decorators to endpoints
- Update auth.py with new permission checks

FRONTEND:
- Update Layout.js sidebar visibility
- Add route guards in App.js

VERIFIED:
- Backend API responding correctly
- Frontend builds successfully
- Tested with Admin, Standard, and Viewer roles"

# 7. Push to remote
git push origin main

# 8. Verify sync
git status
# Should show: "Your branch is up to date with 'origin/main'"
```

---

## Quality Gates

### Never Push If:
- ❌ Application doesn't build
- ❌ There are compilation errors
- ❌ Tests are failing
- ❌ Feature is incomplete or broken
- ❌ Existing functionality is broken
- ❌ There are unresolved merge conflicts

### Always Push After:
- ✅ Feature is complete and tested
- ✅ Application builds successfully
- ✅ No errors in logs
- ✅ All tests pass
- ✅ Code has been reviewed (if applicable)
- ✅ Documentation is updated

---

## Branch Strategy

### Main Branch
- `main` - Production-ready code
- Always stable and deployable
- All features fully tested before merge

### Feature Branches (Optional)
```bash
# Create feature branch
git checkout -b feature/user-rbac

# Work on feature
# ... make changes ...

# Push feature branch
git push origin feature/user-rbac

# Merge to main after review
git checkout main
git merge feature/user-rbac
git push origin main
```

---

## Useful Git Commands

### Status and History
```bash
# Check status
git status

# View commit history
git log --oneline -10

# View changes
git diff

# View specific commit
git show <commit-hash>
```

### Undoing Changes
```bash
# Unstage file
git restore --staged path/to/file.py

# Discard local changes
git restore path/to/file.py

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### Remote Management
```bash
# View remote
git remote -v

# Fetch remote changes
git fetch

# Pull latest
git pull origin main

# Push changes
git push origin main
```

---

## Verification Checklist for Push

Before every `git push`, ensure:

### Code Quality
- [ ] No syntax errors
- [ ] No compilation errors
- [ ] Code follows project conventions
- [ ] No debugging code left (console.log, print statements)

### Testing
- [ ] Backend API responding (curl health check)
- [ ] Frontend builds successfully
- [ ] Feature works as expected
- [ ] Existing features not broken
- [ ] Tested with different user roles (if applicable)

### Documentation
- [ ] README updated (if needed)
- [ ] Comments added for complex code
- [ ] API documentation updated (if endpoints changed)
- [ ] Changelog updated (if maintained)

### Git Hygiene
- [ ] Commit message is clear and descriptive
- [ ] Only relevant files staged
- [ ] No log files or build artifacts committed
- [ ] No sensitive data (passwords, keys) committed
- [ ] Local and remote branches synced

---

## Troubleshooting

### Push Rejected
```bash
# Error: Updates were rejected because the remote contains work
git pull --rebase origin main
git push origin main
```

### Merge Conflicts
```bash
# Pull with rebase to see conflicts
git pull --rebase origin main

# Fix conflicts in files
# Look for <<<<<<, =======, >>>>>>>

# Stage resolved files
git add resolved_file.py

# Continue
git rebase --continue

# Push
git push origin main
```

### Accidentally Committed Wrong Files
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Unstage specific file
git restore --staged unwanted_file.log

# Commit again with correct files
git commit -m "Your message"
```

### Need to Update Commit Message
```bash
# Update last commit message
git commit --amend -m "New commit message"

# Force push (only if not pushed yet or working alone)
git push --force origin main
```

---

## Automation Scripts

### Pre-Commit Check Script
```bash
#!/bin/bash
# pre-commit-check.sh

echo "Running pre-commit checks..."

# Check backend health
echo "1. Checking backend..."
curl -s http://192.168.20.180:5000/api/health || {
  echo "❌ Backend not responding"
  exit 1
}

# Build frontend
echo "2. Building frontend..."
cd frontend && npm run build || {
  echo "❌ Frontend build failed"
  exit 1
}

echo "✅ All checks passed!"
exit 0
```

### Quick Commit and Push Script
```bash
#!/bin/bash
# quick-push.sh

# Run checks
./pre-commit-check.sh || exit 1

# Stage and commit
git add "$@"
git commit

# Push
git push origin main

echo "✅ Changes pushed successfully!"
```

---

## Best Practices

1. **Commit Often**: Small, frequent commits are better than large ones
2. **Pull Before Push**: Always pull latest changes before pushing
3. **Test Before Commit**: Never commit broken code
4. **Write Clear Messages**: Future you will thank you
5. **Review Changes**: Use `git diff` before committing
6. **Keep Main Stable**: Main branch should always be deployable
7. **Don't Commit Secrets**: Use .env files (which are in .gitignore)
8. **Tag Releases**: Use `git tag` for version releases

---

## Recent Commits

### Latest Successful Push
```
Commit: daf5600
Message: Implement comprehensive RBAC for Standard User and Viewer roles
Files Changed: 10
Date: July 25, 2026
Status: ✅ Pushed to origin/main
```

---

## Quick Reference

```bash
# Complete workflow (one-liner)
git add <files> && git commit -m "message" && git push origin main

# Check sync status
git status | grep "up to date"

# View last commit
git log -1

# Verify remote
git remote -v
```

---

**Remember**: The repository should always reflect the latest working state of the application. Never push incomplete or broken features.

