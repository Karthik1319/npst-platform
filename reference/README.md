# Reference copies

## `admin-portal-original/`

The teammate's **NPST Shared Services Admin Portal**, copied **unchanged** as the
baseline for integrating it into this workspace (Steps 17–24, see
`docs/admin-portal-integration.md`). His UI is the source of truth for the design;
this copy lets every later change be compared with the original.

- **Source:** https://github.com/Rajnish33/frontend, commit `21e290f` ("changed some
  functionalities and overall ui of login page", 18 Nov 2026). Updated from `5905b7b`
  (integrated in Steps 17–23) in Step 24; his changes since then: PeopleOS name, new
  colours and NPST logo, redesigned login, Maker/Checker roles and demo accounts, an
  employee dashboard, an AI Summary page, application soft delete and all-application
  branding approvals. `git log -- reference/` shows both versions.
- **Not part of the workspace:** not built, not installed, not linted or formatted
  (`.nxignore`, `.prettierignore`, ESLint ignore). Its `package.json` and imports are
  as he wrote them.
- **Left out on purpose:**
  - `.github/workflows/sync-repositories.yml`: force-pushes his repository to another
    repository with a secret token; must not run from this repository.
  - `.emergent/`: crash recordings of the Emergent platform he built it with.
  - `package-lock.json`, `yarn.lock`: this workspace uses pnpm.
- **Screenshots of the original app:** `reference/screenshots/admin-portal-original/`
  (37 pages and overlays, light and dark, 1440 px wide, including the AI Summary page
  and the employee dashboard), taken by running this commit outside the workspace with
  its own libraries (Step 24; the Step 17 set for `5905b7b` is in git history).
  Names: `<theme>--<page>.jpg`.
