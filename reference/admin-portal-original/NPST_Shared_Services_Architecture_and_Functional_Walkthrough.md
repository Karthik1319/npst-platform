# NPST Shared Services Platform

## Frontend Architecture, Functional Walkthrough, User Stories & Proposed Database Design

**Purpose:** Manager discussion and solution-design draft\
**Scope:** Admin Portal, shared modules, MFE integration, user stories,
workflows, and proposed MySQL data model.\
**Status:** Conceptual design based on the requirements discussed.
Validate implementation status, APIs, ownership, and final schema with
the project team before treating this as an approved technical design.

------------------------------------------------------------------------

# 1. Executive Summary

NPST Shared Services is intended to provide reusable capabilities
consumed by multiple internal applications instead of implementing the
same functionality independently in every application.

Initial applications in scope:

-   Keka HR
-   CRM / Deal Pulse
-   SkillUp Lounge
-   NPST Finance

The platform centralizes administration for Application Management,
User/Employee Management, UI Branding, Notification Templates,
Notification Channels, Reminder Configuration, Escalation Management,
Maker-Checker approvals, and Audit Logs.

The Admin Portal is the administrative control centre. Administrators
configure shared capabilities and associate them with one or more
applications. Each consuming application (MFE) uses the relevant
configuration through agreed APIs, shared frontend packages, or runtime
integration.

**Important:** A frontend screen demonstrates the intended user
experience. It does not, by itself, mean that backend persistence,
authorization, notification delivery, scheduling, escalation execution,
or MFE integration is complete.

# 2. Problem Statement and Proposed Solution

When applications independently manage common functionality, the
organization can face duplicated development, inconsistent branding,
different notification/reminder behaviour, difficult administration, and
poor traceability.

  -----------------------------------------------------------------------
  Challenge               Shared Services         Expected benefit
                          solution                
  ----------------------- ----------------------- -----------------------
  Different application   UI Branding             Consistent, centrally
  branding                                        governed appearance

  Duplicated notification Notification Templates  Reusable templates and
  content                                         codes

  Different delivery      Notification Channels   Standardized channel
  setup                                           configuration

  Repeated reminder logic Reminder Management     Configurable policies

  Inconsistent escalation Escalation Management   Application-specific
  rules                                           escalation

  Separate user           User/Employee           Centralized
  administration          Management              administration where
                                                  appropriate

  Untraceable changes     Audit Logs              Accountability

  Uncontrolled sensitive  Maker-Checker           Separation of request
  changes                                         and approval
  -----------------------------------------------------------------------

## 2.1 Goals

-   One administrative portal for shared capabilities.
-   Support multiple registered applications.
-   Application-scoped configuration and data filtering.
-   Reusable configuration where appropriate.
-   Maker-Checker workflow for sensitive changes.
-   Traceability for administrative actions.
-   Consistent, accessible user experience.
-   Clear integration boundaries for consuming MFEs.

## 2.2 Initial Scope

Application Management; Approval Queue; UI Branding; Notification
Templates; Notification Channels; Reminder Configuration; Escalation
Management; Employee Management; Audit Logs; Settings and accessibility
preferences.

## 2.3 Items Requiring Separate Decisions

Do not assume the frontend alone delivers email/SMS/push infrastructure,
a production reminder scheduler, escalation execution, identity-provider
deployment, employee master ownership, production secrets management, or
final retention/DR strategy. These require backend, security,
infrastructure, and product decisions.

# 3. Users, Roles and Access Model

Use role-based access control (RBAC). Confirm the final
role-to-permission matrix with the product owner and security team.

  -----------------------------------------------------------------------
  Role                    Responsibility          Typical access
  ----------------------- ----------------------- -----------------------
  Super Admin             Platform-wide           Applications, roles,
                          administration          global settings, audit
                                                  visibility

  Maker                   Creates configuration   Draft, edit, submit,
                          requests                track own requests

  Checker                 Reviews submitted       Approval Queue,
                          requests                approve, reject

  Application Admin       Manages permitted       Application-scoped
                          application             configuration
                          configuration           

  Auditor / Read-only     Reviews activity        Read-only permitted
                                                  records

  Employee                Uses consuming          No Admin Portal
                          applications            configuration access
                                                  unless separately
                                                  granted
  -----------------------------------------------------------------------

A user may hold multiple roles only if policy permits. A user must never
approve their own request. The backend must enforce this rule.

## 3.1 Maker-Checker workflow

1.  Maker signs in and creates or edits a controlled configuration.
2.  Maker previews and submits the proposed change.
3.  The request becomes `PENDING_APPROVAL`.
4.  The active configuration remains unchanged.
5.  Maker can track status but cannot approve or reject.
6.  Checker signs in and opens the Approval Queue.
7.  Checker compares previous and proposed configuration.
8.  Checker approves or rejects; rejection requires a reason.
9.  On approval, the approved configuration becomes active.
10. The decision and configuration change are audited.

``` mermaid
flowchart TD
    A[Maker signs in] --> B[Create or edit configuration]
    B --> C[Preview proposed change]
    C --> D[Submit request]
    D --> E[Pending approval]
    E --> F[Checker signs in]
    F --> G[Approval Queue]
    G --> H[Review previous vs proposed]
    H --> I{Decision}
    I -->|Approve| J[Activate approved version]
    I -->|Reject| K[Record rejection reason]
    J --> L[Audit event]
    K --> L
    L --> M[Maker sees final status]
```

Suggested request statuses: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`,
`REJECTED`, `CANCELLED`, and optionally `WITHDRAWN`.

A submitted request should preserve an immutable snapshot of the
proposed configuration. Do not overwrite the active configuration until
approval succeeds.

# 4. Proposed Frontend Architecture

The frontend should support independent feature development while
maintaining a consistent user experience.

## 4.1 Logical architecture

``` mermaid
flowchart TB
    U[Admin / Maker / Checker] --> H[Admin Portal Host]
    H --> S[Shared Shell: Sidebar, Topbar, Theme, Auth]
    H --> AM[Application Management]
    H --> BR[UI Branding]
    H --> NT[Notification Management]
    H --> RM[Reminder Management]
    H --> EM[Employee Management]
    H --> AL[Audit Logs]
    H --> AQ[Approval Queue]

    AM --> API[Backend APIs]
    BR --> API
    NT --> API
    RM --> API
    EM --> API
    AL --> API
    AQ --> API

    API --> DB[(Shared Services Database)]
    API --> IDP[Identity Provider]
    API --> NS[Notification Delivery Adapters]
    API --> SCH[Reminder Scheduler / Worker]

    API --> K[Keka HR MFE]
    API --> C[CRM / Deal Pulse MFE]
    API --> S1[SkillUp Lounge MFE]
    API --> F[NPST Finance MFE]
```

This is a logical target view. It does not mandate one deployable
service per box. The backend may initially be a modular application or
later be split into services based on operational needs.

## 4.2 Host application

The host provides authentication entry, route composition,
sidebar/topbar, theme provider, notification bell, accessibility
controls, shared layout, role-aware navigation, loading states, and
error boundaries.

## 4.3 Remote modules / MFEs

If Module Federation is selected, feature modules may be built and
deployed independently. Potential boundaries include Application
Management, Branding, Notifications, Reminders, Employee Management, and
Audit/Approval.

The team should decide whether these are separate remotes or feature
packages within one frontend initially. Use Module Federation when
independent deployment/team ownership justifies it, not merely as a
label.

## 4.4 Shared frontend libraries

  Library              Responsibility
  -------------------- ----------------------------------------------
  `ui-components`      Buttons, inputs, tables, modals, dropdowns
  `design-tokens`      Colors, typography, spacing, radii
  `auth`               Auth state, route guards, permission helpers
  `theme`              Light/dark theme and runtime branding
  `api-client`         Common API client and error handling
  `notifications-ui`   Notification bell and panel
  `forms`              Reusable controls and validation
  `utils`              Formatting and common helpers

These are proposed boundaries; follow actual repository conventions.

## 4.5 Theme and branding runtime

1.  User opens an MFE.
2.  The MFE identifies itself using a registered application identifier.
3.  The shell or MFE requests the active approved branding.
4.  Theme tokens are applied through a shared provider or CSS variables.
5.  Shared components consume the same tokens.
6.  Updates apply consistently to sidebar, topbar, notifications,
    modals, and forms.

User light/dark preference and application branding are related but
distinct. Define precedence: application branding can provide brand
colors and typography; the user's appearance preference selects the
appropriate surface/text token set.

# 5. Admin Portal Navigation and Module Walkthrough

Suggested navigation:

``` text
Application Management
  - Dashboard
  - Approval Queue (Checker-authorized roles only)
UI Branding
Notification Management
  - Notification Templates
  - Notification Channels
Reminder Management
  - Configuration
  - Escalations
Employee Management
Audit Logs
Settings
```

The Approval Queue must be hidden from unauthorized users, but hiding a
menu item is not security. Route and API authorization are mandatory.

## 5.1 Dashboard / Application Management

Purpose: control centre for registered applications, not a generic
metrics dashboard.

Display application name, identifier, description, status, enabled
modules, optional environment/base URL, created/updated details, and
View/Edit/Activate/Deactivate actions. Provide Add Application. Do not
include an Employees field in Add Application; employee assignment
belongs in user/employee administration.

## 5.2 Approval Queue

Display request ID, type, application, requester, submitted date/time,
status, and View action. Review should show previous and proposed
configuration, differences, Approve, and Reject with mandatory reason.
Branding comparison must be large enough to inspect the complete topbar,
sidebar, content, fonts, colors, and notification appearance.

## 5.3 UI Branding

Potential settings: logo/favicon, primary/secondary colors, sidebar and
topbar styles, page/surface colors, typography, button styles,
border/radius tokens, and light/dark theme tokens.

Maker submits a proposed version. Checker reviews it. Only an approved
version becomes active. Preserve version history for traceability and
possible rollback.

## 5.4 Notification Templates

Manage application-specific template codes, names, categories,
descriptions, subjects, message bodies, variables, channels, status, and
versions.

Illustrative code catalogue (confirm with application owners before
production):

  Application      Example code                 Purpose
  ---------------- ---------------------------- ----------------------
  Keka HR          `KEKA_NEW_HIRE_WELCOME`      New employee welcome
  Keka HR          `KEKA_DOCUMENT_PENDING`      Pending documents
  CRM              `CRM_NEW_LEAD_ASSIGNED`      Lead assignment
  CRM              `CRM_FOLLOWUP_DUE`           Follow-up due
  SkillUp Lounge   `SKILLUP_COURSE_ENROLLED`    Course enrolment
  SkillUp Lounge   `SKILLUP_COURSE_DEADLINE`    Course deadline
  NPST Finance     `FINANCE_PAYMENT_SUCCESS`    Payment completed
  NPST Finance     `FINANCE_APPROVAL_PENDING`   Approval required

### Three-layer notification model

1.  **Template Code Master:** application, code, name, category,
    description.
2.  **Template Definition:** subject, body, variables, version,
    language, status.
3.  **Channel Mapping:** channels enabled for the template and
    associated delivery configuration.

This keeps code metadata separate from message content and delivery
configuration.

## 5.5 Notification Channels

  ------------------------------------------------------------------------
  Channel                 Configuration examples   Backend dependency
  ----------------------- ------------------------ -----------------------
  In-App                  Enablement, display      In-app notification
                          behaviour, bundle        store/API
                          setting                  

  Email                   SMTP host, port, sender, Email adapter
                          TLS, secret reference    

  SMS                     Provider, sender ID,     SMS gateway
                          credential reference,    
                          route                    

  Push                    FCM                      Push adapter
                          project/configuration,   
                          secret reference         
  ------------------------------------------------------------------------

Credentials must be masked. Store secrets in a secrets manager; the
database should store a reference, not raw credentials.

**Bundle Across Apps** is Enabled/Disabled and controls whether eligible
in-app notifications from multiple applications can be grouped for a
user. **Application Scope** is a separate setting: All Applications,
Selected Applications, or Single Application.

## 5.6 Reminder Configuration

Policy fields can include application, reminder code, name, category,
description, reason, trigger event/date, frequency, first reminder
delay, repeat interval, maximum reminders, recipient, channels,
escalation setting, and status.

Example: NPST Finance -- Approval Pending

  Day     Action
  ------- ----------------------
  Day 0   Initial notification
  Day 1   First reminder
  Day 3   Second reminder
  Day 5   Escalation

The scheduler calculates due actions from persisted policy and event
timestamps. The frontend configures and displays the policy; it does not
execute scheduled jobs.

### Three-layer reminder model

1.  **Reminder Code Master:** application, code, name, category,
    description.
2.  **Reminder Reasons:** valid reasons associated with a code.
3.  **Reminder Policy:** trigger, schedule, recipients, channels,
    escalation settings.

A code may be used by multiple policies. Editing a policy must not
accidentally modify the shared code master.

## 5.7 Escalation Management

Provide an application selector: Keka HR, CRM / Deal Pulse, SkillUp
Lounge, NPST Finance. Selecting an application must filter actual
records using `application_id`.

Display associated reminder policy/code, level, trigger condition,
delay, recipient type/recipient, status, and actions.

Example:

``` text
Trigger occurs
  -> Day 0: Initial notification to owner
  -> Day 1: Reminder to owner
  -> Day 3: Level 1 to manager
  -> Day 5: Level 2 to department head
```

This is illustrative; each application/policy defines its own levels and
timings.

## 5.8 Employee Management

Potential fields: employee/user ID, name, work email, phone number,
department, designation, status, roles, and application access.

Changes to editable fields should be audited. Confirm whether Shared
Services owns employee master data or synchronizes it from an HR system.
Avoid competing employee master records.

## 5.9 Audit Logs

Capture actor, action, module, application, entity type/ID, timestamp,
result, correlation ID, and before/after values where appropriate. Do
not log passwords, tokens, secrets, or unnecessary personal data. Normal
users should not be able to edit audit records.

## 5.10 Accessibility and shared shell

The shared topbar can provide notification bell, accessibility controls,
text zoom, contrast options, light/dark mode, profile, and logout.
Current date/time may appear at the sidebar footer using browser local
time and update dynamically.

# 6. User Stories and Acceptance Criteria

These are proposed stories. Prioritize and refine them with the product
owner.

## Epic A --- Application Management

### US-APP-01: View registered applications

**As a** Super Admin, **I want** to view registered applications, **so
that** I can see which applications are connected.

Acceptance criteria: - List shows name, identifier, status, and enabled
modules. - Search/filter and application details are available. - Data
comes from the backend.

### US-APP-02: Register an application

**As a** Super Admin, **I want** to register an application, **so that**
it can be configured to use shared modules.

Acceptance criteria: - Required fields are validated. - Application
identifier is unique. - Add Application has no Employees field. - New
application appears in application-specific dropdowns.

## Epic B --- Maker-Checker

### US-MC-01: Submit branding change

**As a** Maker, **I want** to submit a proposed branding configuration,
**so that** it is reviewed before activation.

Acceptance criteria: - Maker can edit a draft, preview, and submit. -
Submission creates `PENDING_APPROVAL`. - Active branding does not change
before approval. - Maker cannot approve/reject. - Maker can track
status.

### US-MC-02: Review request

**As a** Checker, **I want** to compare previous and proposed branding,
**so that** I can make an informed decision.

Acceptance criteria: - Only authorized Checkers access queue and review
APIs. - Both configurations are clearly visible. - Approve/reject
actions are available. - Checker cannot approve own request. - Rejection
requires a reason.

### US-MC-03: Apply approved request

**As a** Checker, **I want** an approved configuration to become active.

Acceptance criteria: - Approval and activation are transaction-safe. -
Active version changes only after successful approval. - Previous
version is retained as history. - Audit event is created.

## Epic C --- Branding

### US-BR-01: Configure branding

**As a** permitted administrator, **I want** to configure logo, colors,
typography, and styles.

Acceptance criteria: - Configuration is application-scoped. - Preview
reflects selected values. - Validation handles invalid values. -
Sensitive changes follow approval. - Shared shell consumes approved
tokens.

### US-BR-02: Switch appearance

**As a** user, **I want** consistent light/dark appearance.

Acceptance criteria: - Sidebar, topbar, notifications, menus, forms, and
modals follow the selected theme. - Theme changes apply without page
reload. - Portal-rendered popovers inherit the theme. - Contrast remains
readable.

## Epic D --- Notifications

### US-NT-01: Create application-specific template code

**As a** administrator, **I want** to create a code for an application.

Acceptance criteria: - Code, name, category, description are captured. -
Uniqueness is enforced per agreed scope. - Dropdown filters by
application. - Backend validates code ownership.

### US-NT-02: Configure template

**As a** administrator, **I want** to configure subject, body,
variables, and channels.

Acceptance criteria: - Template links to application and code. -
Variables are defined and validated. - Preview is available. -
Versions/status are tracked.

### US-NC-01: Configure channels

**As a** administrator, **I want** to configure In-App, Email, SMS, and
Push.

Acceptance criteria: - Each channel has suitable fields. - Test
Connection exists where supported. - Secrets are masked and stored
securely. - Application scope is configurable. - Status and last test
result are visible.

### US-NC-02: Control cross-app bundling

**As a** administrator, **I want** to enable/disable Bundle Across Apps.

Acceptance criteria: - Dropdown offers Enabled/Disabled. - Setting is
independent of application scope. - Saved value is shown when
reopened. - Backend honours the setting.

## Epic E --- Reminders

### US-RM-01: Create reminder code and reasons

**As a** administrator, **I want** application-specific reminder codes
and reasons.

Acceptance criteria: - Code, name, category, description, and reasons
are maintained. - Code dropdown filters by application. - Reasons filter
by selected code. - Backend validates ownership.

### US-RM-02: Configure reminder policy

**As a** administrator, **I want** to define trigger, schedule,
recipients, and channels.

Acceptance criteria: - Policy references application and code. -
Trigger/schedule values are validated. - Maximum reminders and repeat
intervals are supported. - Recipients/channels are persisted. - Policy
can be enabled/disabled. - Scheduler can consume policy.

## Epic F --- Escalations

### US-ESC-01: View application-specific escalations

**As a** administrator, **I want** to select an application and see only
its escalation policies.

Acceptance criteria: - Application selector is available. - Data filters
by application ID. - Each escalation references a reminder policy. -
Levels, delays, recipients, status are visible. - Empty state is shown
where no policies exist.

### US-ESC-02: Configure escalation levels

**As a** administrator, **I want** to define multiple escalation levels.

Acceptance criteria: - Level order is explicit. - Each level has a
delay/condition and recipient. - Invalid or duplicate levels are
rejected. - Changes are audited and approved where required.

## Epic G --- Employee and Audit

### US-EMP-01: Update employee details

**As a** permitted administrator, **I want** to edit allowed employee
details.

Acceptance criteria: - Editable fields follow permissions. - Phone
number and permitted fields can be updated. - Validation is applied. -
Changes are audited. - Source-of-truth ownership is respected.

### US-AUD-01: Review activity

**As an** Auditor, **I want** to search audit events.

Acceptance criteria: - Filter by actor, module, application, action, and
date. - Before/after data is shown where permitted. - Audit events are
not editable through ordinary UI. - Sensitive values are redacted.

# 7. Proposed MySQL Database Design

This is a logical schema proposal, not a final migration script. Confirm
names, ownership, retention, indexing, and transaction boundaries with
the backend team.

## 7.1 Design principles

-   Stable internal primary keys and foreign keys.
-   Associate application-specific data with `application_id`.
-   Separate internal IDs from human-readable codes.
-   Unique constraints prevent duplicate codes in their agreed scope.
-   Separate master data from policies.
-   Version approval-controlled configuration.
-   Store secrets in a secrets manager; database stores only references.
-   Store timestamps in UTC and display in user timezone.
-   Keep audit events append-only.

## 7.2 ER Diagram

``` mermaid
erDiagram
    APPLICATIONS ||--o{ APPLICATION_MODULES : enables
    MODULES ||--o{ APPLICATION_MODULES : assigned
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : included
    APPLICATIONS ||--o{ BRANDING_CONFIGS : owns
    USERS ||--o{ APPROVAL_REQUESTS : submits
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : records
    APPLICATIONS ||--o{ NOTIFICATION_TEMPLATE_CODES : owns
    NOTIFICATION_TEMPLATE_CODES ||--o{ NOTIFICATION_TEMPLATES : versions
    NOTIFICATION_TEMPLATES ||--o{ TEMPLATE_CHANNEL_MAPPINGS : maps
    APPLICATIONS ||--o{ NOTIFICATION_CHANNEL_CONFIGS : scopes
    APPLICATIONS ||--o{ REMINDER_CODES : owns
    REMINDER_CODES ||--o{ REMINDER_REASONS : has
    REMINDER_CODES ||--o{ REMINDER_POLICIES : used_by
    APPLICATIONS ||--o{ REMINDER_POLICIES : owns
    REMINDER_POLICIES ||--o{ ESCALATION_LEVELS : has
    USERS ||--o{ AUDIT_LOGS : performs
    APPLICATIONS ||--o{ AUDIT_LOGS : relates
```

## 7.3 Core application tables

### `applications`

  Column          Suggested type       Notes
  --------------- -------------------- -----------------
  `id`            BIGINT PK            Internal ID
  `app_code`      VARCHAR(50) UNIQUE   e.g. `KEKA_HR`
  `app_name`      VARCHAR(150)         Display name
  `description`   TEXT                 Description
  `base_url`      VARCHAR(500) NULL    Optional
  `status`        VARCHAR(20)          ACTIVE/INACTIVE
  `created_at`    DATETIME             UTC
  `updated_at`    DATETIME             UTC

### `modules`

`id BIGINT PK`, `module_code VARCHAR(50) UNIQUE`,
`module_name VARCHAR(100)`, `description TEXT`, `status VARCHAR(20)`.

### `application_modules`

`id BIGINT PK`, `application_id BIGINT FK`, `module_id BIGINT FK`,
`enabled BOOLEAN`, `configuration_ref VARCHAR(255) NULL`.\
Unique constraint: (`application_id`, `module_id`).

## 7.4 Identity and RBAC tables

### `users`

`id BIGINT PK`, `identity_subject VARCHAR(255) UNIQUE`,
`email VARCHAR(255) UNIQUE`, `display_name VARCHAR(150)`,
`status VARCHAR(20)`, `created_at DATETIME`, `updated_at DATETIME`.

If an external identity provider is used, do not store plaintext
passwords here.

### `roles`

Suggested seed roles: `SUPER_ADMIN`, `MAKER`, `CHECKER`,
`APPLICATION_ADMIN`, `AUDITOR`.

Columns: `id BIGINT PK`, `role_code VARCHAR(50) UNIQUE`,
`role_name VARCHAR(100)`.

### `permissions`

Columns: `id BIGINT PK`, `permission_code VARCHAR(100) UNIQUE`,
`description TEXT`. Examples: `APPLICATION_VIEW`, `BRANDING_SUBMIT`,
`APPROVAL_REVIEW`, `NOTIFICATION_EDIT`, `REMINDER_EDIT`, `AUDIT_VIEW`.

### `user_roles`

Columns: `user_id BIGINT FK`, `role_id BIGINT FK`,
`application_id BIGINT FK NULL`. Null may represent platform-wide scope
if policy permits.

### `role_permissions`

Columns: `role_id BIGINT FK`, `permission_id BIGINT FK`.

The backend must enforce both role and application scope.

## 7.5 Branding and approval tables

### `branding_configs`

  -------------------------------------------------------------------------------------------------
  Column                  Suggested type          Notes
  ----------------------- ----------------------- -------------------------------------------------
  `id`                    BIGINT PK               Config ID

  `application_id`        BIGINT FK               Application

  `version_no`            INT                     Version

  `config_json`           JSON                    Logo refs, colors, fonts, tokens

  `status`                VARCHAR(20)             DRAFT/PENDING/APPROVED/ACTIVE/REJECTED/ARCHIVED

  `created_by`            BIGINT FK               Maker

  `created_at`            DATETIME                UTC

  `approved_by`           BIGINT FK NULL          Checker

  `approved_at`           DATETIME NULL           UTC
  -------------------------------------------------------------------------------------------------

### `application_branding_state`

`application_id BIGINT PK/FK`, `active_branding_config_id BIGINT FK`,
`updated_at DATETIME`.

This points to the currently active approved version. Update it only
after approval.

### `approval_requests`

  Column                Suggested type       Notes
  --------------------- -------------------- ------------------------------------
  `id`                  BIGINT PK            Request ID
  `request_code`        VARCHAR(50) UNIQUE   Display ID
  `application_id`      BIGINT FK            Application
  `module_code`         VARCHAR(50)          e.g. BRANDING
  `entity_type`         VARCHAR(50)          Entity type
  `entity_id`           BIGINT               Related entity
  `request_type`        VARCHAR(30)          CREATE/UPDATE/DELETE
  `maker_user_id`       BIGINT FK            Submitter
  `checker_user_id`     BIGINT FK NULL       Reviewer
  `status`              VARCHAR(30)          PENDING_APPROVAL/APPROVED/REJECTED
  `proposed_snapshot`   JSON                 Immutable proposal
  `previous_snapshot`   JSON                 State at submission
  `submitted_at`        DATETIME             UTC
  `decided_at`          DATETIME NULL        UTC
  `rejection_reason`    TEXT NULL            Required on rejection

### `approval_actions`

`id BIGINT PK`, `approval_request_id BIGINT FK`,
`actor_user_id BIGINT FK`, `action VARCHAR(30)`, `comments TEXT NULL`,
`created_at DATETIME`.

Backend must reject self-approval and verify checker authorization.
Approval, active-version update, and audit event should be
transaction-safe.

## 7.6 Notification tables

### `notification_template_codes`

  Column             Suggested type   Notes
  ------------------ ---------------- -----------------
  `id`               BIGINT PK        Internal ID
  `application_id`   BIGINT FK        Owner
  `template_code`    VARCHAR(100)     Stable code
  `template_name`    VARCHAR(150)     Display name
  `category`         VARCHAR(80)      Category
  `description`      TEXT             Purpose
  `status`           VARCHAR(20)      ACTIVE/INACTIVE
  `created_at`       DATETIME         UTC

Unique constraint: (`application_id`, `template_code`).

### `notification_templates`

`id BIGINT PK`, `template_code_id BIGINT FK`, `version_no INT`,
`channel VARCHAR(20)`, `subject VARCHAR(255) NULL`, `body TEXT`,
`variables_json JSON`, `status VARCHAR(20)`, `created_by BIGINT FK`,
`created_at DATETIME`.

One option is one row per channel/version. Another is a logical template
with child channel-content rows. Choose one model consistently.

### `notification_channel_configs`

  Column                 Suggested type      Notes
  ---------------------- ------------------- ----------------------------
  `id`                   BIGINT PK           Config ID
  `application_id`       BIGINT FK NULL      Null only for global scope
  `channel_type`         VARCHAR(20)         IN_APP/EMAIL/SMS/PUSH
  `scope_type`           VARCHAR(30)         ALL/SELECTED/SINGLE
  `is_enabled`           BOOLEAN             Enabled
  `bundle_across_apps`   BOOLEAN             Relevant to In-App
  `config_json`          JSON                Non-secret settings
  `secret_reference`     VARCHAR(255) NULL   Vault reference
  `status`               VARCHAR(20)         ACTIVE/INACTIVE
  `updated_at`           DATETIME            UTC

For selected-app scope, use
`channel_config_applications(config_id, application_id)`.

### `template_channel_mappings`

`id BIGINT PK`, `template_id BIGINT FK`, `channel_config_id BIGINT FK`,
`enabled BOOLEAN`.

## 7.7 Reminder tables

### `reminder_codes`

  Column             Suggested type   Notes
  ------------------ ---------------- -----------------
  `id`               BIGINT PK        Internal ID
  `application_id`   BIGINT FK        Owner
  `reminder_code`    VARCHAR(100)     Stable code
  `reminder_name`    VARCHAR(150)     Display name
  `category`         VARCHAR(80)      Category
  `description`      TEXT             Purpose
  `status`           VARCHAR(20)      ACTIVE/INACTIVE

Unique constraint: (`application_id`, `reminder_code`).

### `reminder_reasons`

`id BIGINT PK`, `reminder_code_id BIGINT FK`,
`reason_code VARCHAR(100)`, `reason_label VARCHAR(150)`,
`description TEXT NULL`, `status VARCHAR(20)`.

### `reminder_policies`

  Column                        Suggested type   Notes
  ----------------------------- ---------------- -----------------------
  `id`                          BIGINT PK        Policy ID
  `application_id`              BIGINT FK        Application
  `reminder_code_id`            BIGINT FK        Code
  `reminder_reason_id`          BIGINT FK NULL   Reason
  `policy_name`                 VARCHAR(150)     Name
  `description`                 TEXT             Purpose
  `trigger_event`               VARCHAR(100)     Event key
  `frequency`                   VARCHAR(20)      DAILY/WEEKLY/etc.
  `first_reminder_after_days`   INT              Initial delay
  `repeat_interval_days`        INT              Repeat interval
  `max_reminders`               INT              Maximum
  `recipient_config_json`       JSON             Recipient rules
  `channel_config_json`         JSON             Channel selection
  `escalation_enabled`          BOOLEAN          Enable escalation
  `status`                      VARCHAR(20)      ACTIVE/INACTIVE/DRAFT
  `created_by`                  BIGINT FK        Creator
  `created_at`                  DATETIME         UTC
  `updated_at`                  DATETIME         UTC

For complex scheduling, model timezone, business-calendar rules, trigger
strategy, and end condition explicitly rather than hiding all logic in
JSON.

## 7.8 Escalation tables

### `escalation_levels`

`id BIGINT PK`, `reminder_policy_id BIGINT FK`, `level_no INT`,
`delay_after_days INT`, `recipient_type VARCHAR(30)`,
`recipient_ref VARCHAR(255)`, `channel_config_json JSON`,
`is_enabled BOOLEAN`.

Unique constraint: (`reminder_policy_id`, `level_no`).

### Optional `escalation_execution_logs`

`id`, `reminder_policy_id`, `escalation_level_id`, `business_reference`,
`executed_at`, `result`, `failure_reason`, `correlation_id`.

This is operational scheduler history, distinct from administrative
Audit Logs.

## 7.9 Employee and audit tables

### `employee_profiles`

If Shared Services owns employee data: `id BIGINT PK`,
`user_id BIGINT FK`, `employee_code VARCHAR(50)`,
`phone_number VARCHAR(30)`, `department VARCHAR(100)`,
`designation VARCHAR(100)`, `status VARCHAR(20)`, `updated_at DATETIME`.

If an HR application is the source of truth, synchronize/reference its
records rather than creating a competing employee master.

### `audit_logs`

  Column             Suggested type      Notes
  ------------------ ------------------- ------------------------------
  `id`               BIGINT PK           Event ID
  `actor_user_id`    BIGINT FK NULL      Actor
  `application_id`   BIGINT FK NULL      Application
  `module_code`      VARCHAR(50)         Module
  `entity_type`      VARCHAR(80)         Entity
  `entity_id`        VARCHAR(80)         Entity identifier
  `action`           VARCHAR(50)         CREATE/UPDATE/APPROVE/REJECT
  `before_json`      JSON NULL           Previous state
  `after_json`       JSON NULL           New state
  `correlation_id`   VARCHAR(100) NULL   Request tracing
  `created_at`       DATETIME            UTC

Never log credentials, access tokens, or secrets.

# 8. Key Relationships and Data Flows

## 8.1 Notification flow

``` text
applications
  -> notification_template_codes
       -> notification_templates
            -> template_channel_mappings
                 -> notification_channel_configs
```

The UI fetches codes for the selected application. The backend validates
that the chosen code belongs to that application.

## 8.2 Reminder and escalation flow

``` text
applications
  -> reminder_codes
       -> reminder_reasons
       -> reminder_policies
            -> escalation_levels
```

Escalation Management filters by `application_id`; it must not merely
change the heading while showing the same records.

## 8.3 Maker-Checker branding flow

``` text
Maker creates proposed branding version
  -> approval_requests stores previous/proposed snapshots
  -> Checker approves or rejects
  -> Approve: active version pointer changes
  -> Reject: active version remains unchanged
  -> audit_logs records the decision
```

Use a database transaction so approval, activation, and audit records
cannot become inconsistent.

# 9. Suggested API Surface

These are illustrative routes for architecture discussion, not confirmed
NPST API contracts.

  ----------------------------------------------------------------------------------------------------
  Area                    Example endpoint                                     Purpose
  ----------------------- ---------------------------------------------------- -----------------------
  Applications            `GET /api/v1/applications`                           List apps

  Applications            `POST /api/v1/applications`                          Register app

  Applications            `GET /api/v1/applications/{id}`                      Application detail

  Branding                `GET /api/v1/applications/{id}/branding/active`      Active branding

  Branding                `POST /api/v1/applications/{id}/branding/requests`   Submit branding

  Approvals               `GET /api/v1/approvals?status=PENDING_APPROVAL`      Checker queue

  Approvals               `POST /api/v1/approvals/{id}/approve`                Approve

  Approvals               `POST /api/v1/approvals/{id}/reject`                 Reject with reason

  Templates               `GET /api/v1/applications/{id}/notification-codes`   App codes

  Templates               `POST /api/v1/notification-templates`                Create template

  Channels                `GET /api/v1/notification-channels`                  List configs

  Channels                `PUT /api/v1/notification-channels/{id}`             Update config

  Reminders               `GET /api/v1/applications/{id}/reminder-codes`       Reminder codes

  Reminders               `POST /api/v1/reminder-policies`                     Create policy

  Escalations             `GET /api/v1/applications/{id}/escalations`          App escalations

  Employees               `GET /api/v1/employees`                              List permitted
                                                                               employees

  Audit                   `GET /api/v1/audit-logs`                             Search audit events
  ----------------------------------------------------------------------------------------------------

Security requirements: authenticate protected requests; authorize every
action server-side; enforce application scope; block self-approval;
validate code ownership; mask secrets; paginate list endpoints; consider
idempotency/concurrency protection for submissions and decisions.

# 10. UI/UX Standards

## 10.1 Modal layouts

Use a reusable modal pattern but different sizes for different tasks.

-   Form modals: suitable width, two-column grid, scrollable body,
    visible footer.
-   Branding review: wide comparison modal with two readable previews.
-   Use `minmax(0, 1fr)`, `min-width: 0`, and `box-sizing: border-box`.
-   Avoid fixed field widths and absolute positioning for ordinary form
    fields.
-   Test desktop, tablet, and mobile.

## 10.2 Theme consistency

Theme tokens should cover sidebar, topbar, notification bell/panel,
dropdowns, popovers, modals, forms, tables, tooltips, and
focus/hover/active/disabled states. Portal-rendered components must
receive the active theme.

## 10.3 Accessibility

Keyboard-accessible controls, visible focus, input labels, sufficient
contrast, text zoom, clear validation, accessible modal focus handling,
and status indicators that do not rely on color alone.

# 11. Non-Functional Requirements

  Area              Requirement
  ----------------- -------------------------------------------------------
  Security          Authentication, RBAC, application-level authorization
  Auditability      Trace sensitive changes and approvals
  Performance       Pagination and efficient application-scoped queries
  Reliability       Transaction-safe approval and activation
  Scalability       Add applications without duplicating module logic
  Maintainability   Reusable components and clear module boundaries
  Accessibility     Keyboard support and readable contrast
  Observability     Correlation IDs and structured logs
  Data protection   Mask secrets and minimize personal data
  Time handling     Store UTC; display in user's timezone

# 12. Suggested Implementation Phases

1.  **Foundation:** Confirm app registry, module ownership, identity
    provider, role model, frontend shell, shared components, theme
    tokens, API conventions, migrations.
2.  **Application and access:** Application Management,
    user/role/permission management, Maker-Checker foundation, Approval
    Queue.
3.  **Branding:** Configuration model, preview, versioning, approval,
    runtime retrieval by MFEs.
4.  **Notifications:** Code master, template definitions/versioning,
    four channel configurations, delivery adapters.
5.  **Reminders and escalation:** Code/reason master, policies,
    scheduler/worker, escalation levels and execution tracking.
6.  **Employee, audit and hardening:** HR integration, Audit Logs,
    security, accessibility, responsive and end-to-end MFE testing.

# 13. Testing Strategy

## Frontend

-   Role-aware navigation and protected routes.
-   Application-specific dropdown filtering.
-   Form validation and modal scrolling.
-   Theme switching across shared components.
-   Branding comparison.
-   Loading, empty, error, and success states.
-   Responsive layouts.

## Backend

-   Role and permission enforcement.
-   Maker cannot approve own request.
-   Checker can approve/reject only authorized requests.
-   Rejection requires reason.
-   Application ownership validation.
-   Transaction consistency during approval.
-   Audit event creation.
-   Secret masking.
-   Scheduler and escalation behaviour.

## Integration

-   MFE identifies the correct application.
-   MFE retrieves approved branding.
-   Notification request resolves correct template.
-   Reminder event schedules correct work.
-   Escalation targets correct recipient.
-   Identity and application context are propagated securely.

# 14. Manager Demo Walkthrough

1.  Explain the problem and purpose of Shared Services.
2.  Show Dashboard and registered applications.
3.  Log in as Maker.
4.  Change branding, preview, and submit.
5.  Show that Maker cannot access Approval Queue.
6.  Log in as Checker.
7.  Review previous/proposed branding and approve or reject.
8.  Explain audit trail.
9.  Create/show an application-specific notification template.
10. Explain In-App, Email, SMS, Push, application scope, and Bundle
    Across Apps.
11. Show reminder policy and Day 0 / Day 1 / Day 3 / Day 5 example.
12. Switch application selector in Escalation Management.
13. Show Employee Management and Audit Logs.
14. Demonstrate light/dark theme and accessibility.
15. Clearly state which actions are frontend demonstrations and which
    need backend integration.

# 15. Decisions Required from Manager / Architecture Team

  -----------------------------------------------------------------------
  Decision                            Question
  ----------------------------------- -----------------------------------
  MFE topology                        Separate remote deployments or
                                      feature modules in one host
                                      initially?

  Monorepo                            Is Nx the approved repository/build
                                      approach?

  Federation                          Is Module Federation required now
                                      or later?

  Identity                            Which identity provider and role
                                      source?

  Application registry                Who can register applications and
                                      approve registration?

  Branding                            Which fields can each application
                                      override?

  Approval                            Which changes require
                                      Maker-Checker?

  Employee master                     Is Shared Services owner or is data
                                      synchronized from HR?

  Notification provider               Which SMTP, SMS, and FCM
                                      infrastructure?

  Reminder scheduler                  Which backend service/worker
                                      executes schedules?

  Escalation recipients               How are managers, roles, and
                                      departments resolved?

  Audit retention                     What is the retention/access
                                      policy?

  Database ownership                  One shared schema or service-owned
                                      schemas?

  Configuration scope                 Which settings are global,
                                      app-specific, or user-specific?
  -----------------------------------------------------------------------

# 16. Frontend Demonstration vs Production Capability

  -----------------------------------------------------------------------
  Capability              Frontend can            Backend/integration
                          demonstrate             needed
  ----------------------- ----------------------- -----------------------
  Application Management  Forms, list, filters    Persistent registry

  Maker-Checker           Demo roles, queue,      Identity,
                          review UI               authorization,
                                                  persistence

  Branding                Editor and preview      Version storage,
                                                  approval activation,
                                                  MFE retrieval

  Notification Templates  Code selection, form,   Template storage,
                          preview                 rendering, delivery

  Notification Channels   Config forms and test   Provider integration,
                          UI                      secret storage

  Reminders               Policy configuration UI Scheduler, event
                                                  ingestion, delivery

  Escalations             App-specific policy UI  Execution worker,
                                                  recipient resolution

  Employee Management     Editable profile UI     HR/user master
                                                  integration

  Audit Logs              Table and filters       Durable append-only
                                                  event pipeline
  -----------------------------------------------------------------------

Do not describe a frontend-only demonstration as a completed backend
capability.

# 17. Glossary

  -----------------------------------------------------------------------
  Term                                Meaning
  ----------------------------------- -----------------------------------
  Shared Services                     Common capabilities available to
                                      multiple applications

  MFE                                 Micro Frontend

  Host                                Main frontend shell
                                      composing/loading modules

  Remote                              Frontend module loaded by a host in
                                      federation setup

  RBAC                                Role-Based Access Control

  Maker                               User who creates and submits a
                                      change request

  Checker                             User who reviews and
                                      approves/rejects a request

  Template Code                       Stable identifier for a
                                      notification template

  Reminder Policy                     Rules defining when/how reminders
                                      are generated

  Escalation                          Routing an unresolved item to
                                      another recipient/level

  Audit Log                           Record of who performed an action
                                      and when

  Design Tokens                       Reusable colors, typography,
                                      spacing, and component values

  API                                 Interface used by systems to
                                      communicate
  -----------------------------------------------------------------------

# 18. Closing Summary

The proposed NPST Shared Services platform centralizes common
capabilities while allowing each internal application to retain
application-specific configuration.

**Centralize the capability, configure it per application, govern
sensitive changes, and expose it through reusable integration
contracts.**

The Admin Portal provides the administrative experience. Backend
capabilities provide persistence, authorization, scheduling, delivery,
approval, and auditability. Consuming MFEs integrate through agreed APIs
and frontend contracts.

The next step after the manager discussion is to confirm the decisions
in Section 15, agree on database ownership boundaries, and convert the
user stories into prioritized frontend and backend implementation tasks.
