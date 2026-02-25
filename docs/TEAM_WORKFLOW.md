# TECH GUARDIANS — Collaboration Workflow

## 🌿 Branch Rules

- `main` → Stable demo-ready code (DO NOT push directly)
- `dev` → Integration branch
- `feature/*` → Individual work branches

Examples:
- feature/frontend-ui
- feature/ela-analysis
- feature/blockchain-ledger
- feature/api-auth

---

## 🚀 Workflow (Everyone)

1. Pull latest dev:
   git checkout dev
   git pull origin dev

2. Create your feature branch:
   git checkout -b feature/<your-work>

3. Work + commit normally.

4. Push:
   git push -u origin feature/<your-work>

5. Open Pull Request:
   feature/* → dev

---

## 🔥 Merge Policy

- Only Team Lead merges PRs.
- main is updated only via PR from dev.

---

## 📦 Project Modules

- frontend → UI dashboard
- backend → API + logic
- forensics → ELA / FFT modules
- blockchain → hash + verification
- ai → scoring & risk analysis

---

## ⚠️ Golden Rules

- Never push directly to main.
- Pull before starting work.
- Keep commits small and meaningful.