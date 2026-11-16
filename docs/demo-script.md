# NPST Portal – demo script

A 15–20 minute walkthrough for business stakeholders. It shows one portal for every employee, applications that open inside it, role-based access, shared notifications and one business process that crosses applications.

Everything shown runs on sample data. Sign-in is simulated (pick a user, no password); the real portal will use the central login described in `docs/architecture.md`.

## Before the demo

```bash
git pull
pnpm install
pnpm nx run-many -t dev
```

This starts the portal (http://localhost:4200) and its applications (ports 4201–4204). Wait until all five servers report they are ready, then open http://localhost:4200.

To start from a clean state: sign in as **Admin User**, open the account menu (top right) and choose **Reset demo data**.

| Demo user  | Role      | Sees                                                       |
| ---------- | --------- | ---------------------------------------------------------- |
| Admin User | ADMIN     | All applications, approvals, change history, Admin Console |
| User 1     | SALES     | Sales Hub, Projects & Delivery (view only)                 |
| User 2     | SOLUTIONS | Projects & Delivery, People & HR                           |
| User 3     | EMPLOYEE  | People & HR                                                |

## 1. One portal for everyone (Admin User, 3 min)

1. Sign in as **Admin User**.
2. **Portal Home:** greeting, the four applications, headline figures (sales pipeline, active projects, employees, pending approvals), the sales funnel, project health, notifications, my tasks and recent activity from all applications.
3. Open the **bell** (top right): notifications from Sales Hub, Projects and People & HR in one place. Click "Project PRJ-221 is at risk": the portal opens the project in Projects & Delivery.
4. Type **ABC** in the search box at the top (or press Ctrl K): results come from all applications the user can open.

**Message:** employees start every day in one place; each application keeps its own screens, but the portal brings their updates together.

## 2. The applications (Admin User, 5 min)

- **Sales Hub** (left navigation → Sales Hub): dashboard → **Leads** (search, filters) → **Opportunities** (pipeline stages, click "Proposal") → open **ABC Bank – Digital Banking Platform**: customer, requirements, team, timeline, notes, documents, change history.
- **Projects & Delivery:** dashboard (projects needing attention, resource allocation with one over-allocated manager) → **Projects** → **PRJ-221** (timeline, milestones, risks) → **Tasks** board.
- **People & HR:** dashboard (attendance today, approvals, birthdays) → **Employee directory** (filter by department) → open a profile → **Leave management**.

**Message:** three applications built by different teams, two in React and one in Angular, look and behave as one product. The colours come from one central theme.

## 3. Access follows the role (2 min)

1. Account menu → **Sign out**, sign in as **User 3** (Employee). Portal Home shows only People & HR figures; Sales and Projects are not in the navigation. Opening http://localhost:4200/sales directly shows "Access denied".
2. Sign out, sign in as **User 1** (Sales). Projects & Delivery opens with a **View only** badge: the task board has no move controls.

**Message:** each user sees only what their role allows. (In the real system the backends check permissions again; hiding a button is only the user interface.)

## 4. A process across applications (6 min)

**Sales asks the Solutions team for a proposal.**

1. As **User 1**: Sales Hub → **Opportunities** → **New opportunity**. Customer **ABC Bank**, name "UPI Merchant Payments", product "Merchant Acquiring (UPI + Soundbox)" → **Create opportunity**. The portal confirms it, and the new opportunity opens.
2. Click **Request solution proposal** → **Send to Solutions team**. The timeline and Related tasks show the request.
3. Sign out, sign in as **User 2** (Solutions). The bell shows **"Proposal task assigned: ABC Bank"** and My Tasks lists it.
4. Click the notification: Projects & Delivery opens the task board with the task highlighted and tagged **"From Sales Hub"**.
5. Move it to **In progress**, then to **Done**.
6. Sign out, sign in as **User 1**. The bell shows **"Completed by User 2: Prepare solution proposal – ABC Bank"**. Click it: the opportunity's timeline shows when the work started and finished.
7. Sign in as **Admin User**: Portal Home's Recent activity lists every step.

**An employee asks for leave.**

1. As **User 3**: People & HR → **Leave management** → **Apply for leave**, pick dates and a reason → **Submit request**.
2. As **Admin User**: the bell shows "Leave request from User 3" → open it → **Approve**.
3. As **User 3**: the bell shows "Your leave request was approved"; the balance is updated.

**Message:** teams hand work to each other through the platform (tasks and notifications), not through email or spreadsheets, and everyone sees the outcome where they work.

## 5. Under the hood (optional, 2 min)

- The portal and each application are built and deployed separately; an application can be updated without rebuilding the portal (`docs/PROGRESS.md`, Step 8).
- If an application is down, only its area shows "not available right now" with **Try again**; the rest of the portal keeps working (Step 7).
- Changing one colour on the brand server changes every application after a reload, without a rebuild (Step 9).
