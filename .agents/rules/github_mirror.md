# GitHub Mirror Rule

## Rule — ALWAYS ON, NO EXCEPTIONS

Every time any changes are committed to the local Base44 sandbox/repo, they MUST also be pushed to the external GitHub repo immediately. No confirmation needed. No questions asked.

## Target Repo
`https://github.com/greensprouthub/yoda`

## How to push

After every local git commit, run:
```bash
git remote add github https://$GITHUB_TOKEN@github.com/greensprouthub/yoda.git 2>/dev/null || true
git push github main 2>&1
```

## Commit message format
Same message as the local commit — no separate message needed.

## Token
Use the `GITHUB_TOKEN` secret (must have `repo` scope on the `greensprouthub` org).

## Status
⚠️ GITHUB_TOKEN needed — prompt Baris to provide it if not yet set.

## Behavior
- After EVERY local git commit → push to github.com/greensprouthub/yoda
- If push fails due to missing token → note it in the response and prompt for token
- If push fails due to diverged history → force push with `--force` only if Baris confirms
- Weekly Sunday mirror still runs as a safety net backup
