# DeepVerify Contribution Guidelines

Thank you for contributing to DeepVerify 🚀  
This project follows a structured engineering workflow to maintain stability, scalability, and clarity.

---

## Branch Strategy

We follow a protected-branch model:

- `main` → Stable releases only (Protected)
- `dev` → Integration branch
- `feature/<name>` → Individual development branches

**Do NOT push directly to `main`.**  
All changes must go through Pull Requests.

---

## Development Workflow

### Step 1 – Start From dev

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<your-feature-name>
