# ShivamGawade-XS — GitHub Authentication and Contributor Commands

This guide is for the owner of the `ShivamGawade-XS` account. Use a newly generated token after revoking any token that was exposed. **Never paste a PAT into chat, source files, shell history, screenshots, or commit messages.**

## Option A — GitHub CLI device login

This is usually the safest method because GitHub handles the token exchange.

```bash
gh auth login --hostname github.com --git-protocol https --web
```

GitHub CLI prints a one-time code, for example `AB12-CD34`, and opens `https://github.com/login/device`. On the device page, choose **Continue as ShivamGawade-XS**, enter the displayed code, and approve the request.

Verify the account:

```bash
gh auth status
gh api user --jq '{login: .login, name: .name}'
```

Expected result:

```json
{"login":"ShivamGawade-XS","name":"Shivam_Gawade"}
```

If the result shows `24co35-ops`, log out and repeat the login using the ShivamGawade-XS browser account:

```bash
gh auth logout --hostname github.com
gh auth login --hostname github.com --git-protocol https --web
```

## Option B — Fine-grained PAT through GitHub CLI

On GitHub, open **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Choose `ShivamGawade-XS` as the resource owner, restrict repository access to `24co35-ops/Dayflow---Human-Resource-Management-System`, and grant **Contents: Read and write** plus **Metadata: Read-only**. Add **Pull requests: Read and write** if you will open a PR.

Authenticate without placing the token in a command argument:

```bash
gh auth login --hostname github.com --git-protocol https --with-token
```

The terminal waits for input. Paste the new PAT only at that prompt, press Enter, and then verify:

```bash
gh auth status
gh api user --jq .login
```

Expected output:

```text
ShivamGawade-XS
```

Do not use this unsafe pattern because it can leak into shell history:

```bash
# Do not do this:
gh auth login --with-token <<< "github_pat_..."
```

## Clone the Dayflow repository

```bash
gh repo clone 24co35-ops/Dayflow---Human-Resource-Management-System
cd Dayflow---Human-Resource-Management-System
git switch main
git pull --ff-only origin main
```

Confirm the remote:

```bash
git remote -v
```

Expected remote:

```text
origin  https://github.com/24co35-ops/Dayflow---Human-Resource-Management-System.git (fetch)
origin  https://github.com/24co35-ops/Dayflow---Human-Resource-Management-System.git (push)
```

## Configure truthful Git identity

Use the email address verified on Shivam’s GitHub account. If the account’s verified email is private, GitHub provides a noreply address in **Settings → Emails**.

```bash
git config user.name "ShivamGawade-XS"
git config user.email "YOUR_VERIFIED_GITHUB_EMAIL"
git config --get user.name
git config --get user.email
```

Example only; replace it with Shivam’s actual verified address:

```bash
git config user.name "ShivamGawade-XS"
git config user.email "123456789+ShivamGawade-XS@users.noreply.github.com"
```

## Create a contributor branch

```bash
git switch -c feat/shivam-major-contribution
git status --short --branch
```

## Recommended major contribution package

Make real changes in a feature branch. The following package is large enough to be a meaningful contribution and creates several independently reviewable commits:

```text
1. Add mobile sidebar or responsive navigation behavior.
2. Add employee leave workflow QA coverage.
3. Add HR approval workflow QA coverage.
4. Add loading and error recovery states.
5. Add authenticated Supabase profile mapping or its tests.
6. Document the contributor-owned implementation and verification.
```

Before committing, run the checks:

```bash
cd frontend
pnpm install --ignore-scripts
./node_modules/.bin/tsc -p tsconfig.build.json --pretty false
./node_modules/.bin/vite build
cd ..
python3 -m pytest qa -q
```

Expected QA result for the current repository is similar to:

```text
13 passed
```

## Create genuine commits

Use one coherent change per commit. The examples below are commit messages, not empty commits; each must correspond to an actual diff.

```bash
git add frontend/src frontend/tests
 git commit -m "feat: add responsive contributor navigation"
```

The leading space before `git commit` above is harmless in most shells, but this cleaner form is preferred:

```bash
git commit -m "feat: add responsive contributor navigation"
```

Additional examples:

```bash
git add qa/test_employee_leave_workflow.py
git commit -m "test: cover employee leave workflow"

git add qa/test_hr_approval_workflow.py
git commit -m "test: cover HR approval workflow"

git add frontend/src/components/AsyncState.tsx
git commit -m "feat: add loading and error recovery states"

git add backend/app/core/supabase.py backend/app/api/routes/dayflow.py
git commit -m "feat: map authenticated Supabase profiles"

git add docs/SHIVAM_CONTRIBUTION.md
git commit -m "docs: record contributor implementation"
```

Inspect the commits before pushing:

```bash
git log --oneline --decorate -n 10
git show --stat --oneline HEAD
git status --short
```

## Push the contributor branch

```bash
git push -u origin feat/shivam-major-contribution
```

Verify that GitHub sees the branch:

```bash
gh pr create \
  --base main \
  --head feat/shivam-major-contribution \
  --title "Add Shivam-owned Dayflow HR workflows" \
  --body "Adds responsive navigation, workflow QA, recovery states, Supabase profile mapping, and contributor documentation."
```

If you do not want to open a PR from the CLI, copy the branch URL printed after the push and open it on GitHub manually.

## Coordinator review and merge

After the branch exists, the coordinator can run:

```bash
cd Dayflow---Human-Resource-Management-System
git fetch origin feat/shivam-major-contribution
git checkout -b review/shivam-major-contribution origin/feat/shivam-major-contribution
(cd frontend && ./node_modules/.bin/tsc -p tsconfig.build.json --pretty false)
python3 -m pytest qa -q
git log --format='%h | %an <%ae> | %s' origin/main..origin/feat/shivam-major-contribution
gh pr checks --watch
```

The coordinator should merge through the pull request only after reviewing the diff and checks:

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch=false
```

A squash merge preserves the contributor in the PR but collapses individual commits. If the evaluator needs to see every individual Shivam commit on `main`, use a regular merge instead:

```bash
gh pr merge <PR_NUMBER> --merge --delete-branch=false
```

## Verify both accounts after merge

```bash
git fetch --all --prune
git checkout main
git pull --ff-only origin main
git log origin/main --format='%h | %an <%ae> | %s' -n 20
gh api repos/24co35-ops/Dayflow---Human-Resource-Management-System/commits --paginate \
  --jq '.[].commit.author.name' | sort | uniq -c
```

The final history should show both `24co35-ops` and `ShivamGawade-XS` only if Shivam’s GitHub account actually authored and pushed the branch. Do not manually alter author metadata to simulate this result.
