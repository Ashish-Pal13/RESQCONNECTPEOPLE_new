# RESQ~CONNECT — Full Stack Project

React 19 + **Webpack 5** + Babel frontend (plain CSS, React Router, React Icons), **Java 17 + Spring Boot 3 REST API (built with Gradle)**, PostgreSQL database `RESQCONNECTPEOPLE`, JWT authentication (HS256) and bcrypt password hashing.

The backend was rewritten from Node.js/Express to Java. Every API route, request and response format, error message, permission rule, rate limit and database query was kept the same, so the React frontend did not change and your existing PostgreSQL data and accounts keep working.

The admin portal is a faithful React rebuild of the original single-file admin portal in `reference/original-admin-portal.html`. That file is the source of truth for the admin portal's design and wording. There is no Vite, Rollup, esbuild or Tailwind in this project.

```text
RESQCONNECTPEOPLE/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── videos/resq-hero.mp4      homepage hero video (served as a static file)
│   │   └── images/
│   │       ├── hero-poster.webp      poster / fallback image
│   │       └── resq-connect-logo.png official logo (transparent PNG)
│   ├── src/                          React app (layouts/, admin/, user/, public/, lib/, styles/)
│   ├── babel.config.json
│   ├── webpack.config.js
│   └── package.json
├── backend/                          Java 17 + Spring Boot 3 (Gradle)
│   ├── src/main/java/com/resqconnect/
│   │   ├── ResqConnectApplication.java  starts the server
│   │   ├── config/                   Spring setup: settings, connection pool, bcrypt, request filter
│   │   ├── http/                     request pipeline: routing, security headers, CORS, JSON, rate limits, static files
│   │   ├── api/                      the REST endpoints (auth, incidents, volunteers, assignments, …) and JWT
│   │   ├── domain/                   assignment rules, phone validation, notifications, pagination
│   │   ├── db/                       PostgreSQL access (plain JDBC with SQL parameters)
│   │   ├── util/                     JSON, input validation, .env loading
│   │   └── tools/                    db-create, migrate and seed commands
│   ├── src/main/resources/application.properties
│   ├── build.gradle, settings.gradle, gradlew, gradlew.bat, gradle/wrapper/
│   ├── sql/
│   │   ├── migrations/               versioned migrations (run with gradlew migrate)
│   │   ├── schema.sql                full current schema, for reference or pgAdmin
│   │   ├── create_database.sql
│   │   └── queries.sql               handy pgAdmin queries
│   └── .env.example
├── reference/original-admin-portal.html
├── docs/                             VERIFICATION.md and comparison screenshots
└── README.md
```

## 1. Requirements

- **Java JDK 17 or 21** for the backend (for example Eclipse Temurin). Check with `java -version`. Gradle does **not** need to be installed: the included Gradle wrapper (`gradlew` / `gradlew.bat`) downloads Gradle 8.14.3 the first time.
- Node.js 20.19+ or 22.12+ and npm, for the frontend only
- PostgreSQL 14 or newer, with pgAdmin optional
- An internet connection the first time you build the backend, so Gradle can download Spring Boot and the PostgreSQL driver
- Any OS. On Windows PowerShell use `.\gradlew.bat …`; on macOS and Linux use `./gradlew …`. None of the commands needs the `psql` program.

## 2. Install dependencies

```bash
cd frontend
npm install
```

The backend has no separate install step: the first Gradle command downloads everything it needs.

## 3. Configure PostgreSQL and the environment

Copy `backend/.env.example` to `backend/.env` (PowerShell: `Copy-Item backend\.env.example backend\.env`) and fill it in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/RESQCONNECTPEOPLE`. Keep the database name uppercase. URL-encode special characters in the password (`@` → `%40`, `#` → `%23`). |
| `JWT_SECRET` | A long random string, at least 32 characters. |
| `COORDINATOR_USERNAME` / `COORDINATOR_PASSWORD` | First **Emergency Coordinator** login. Password at least 12 characters. |
| `VERIFIER_USERNAME` / `VERIFIER_PASSWORD` | First **Volunteer Verification Admin** login. Password at least 12 characters. |
| `COORDINATOR_EMAIL` / `VERIFIER_EMAIL` | Optional. Defaults to `<username>@resqconnect.local`. |
| `CLIENT_ORIGIN` | Allowed browser origin(s) for CORS, comma-separated. Default `http://localhost:5173`. |
| `TRUST_PROXY` | Leave empty (or `false`) for local development. Behind one reverse proxy (Nginx, a hosting load balancer) set `1`, so rate limiting sees real visitor IPs. Also accepted: a hop count up to 10, or a comma-separated list of proxy IPs/CIDR ranges (`loopback, 10.0.0.0/8`). `true` trusts every proxy and should only be used when the app is reachable exclusively through your proxy. Any other value stops the server at start-up with a clear message. |
| `PORT` | API port, default `5000`. |
| `DB_POOL_MAX` | Optional. Maximum database connections, default `10`. |
| `FRONTEND_DIST` | Optional. Folder with the built frontend, default `../frontend/dist`. |

The Java backend reads `backend/.env` itself (the same file the Node version used), so you don't need to set anything in Windows. Real environment variables take priority over the file.

No passwords are stored in the source code. Never commit `.env`.

## 4. Create the database

```bash
cd backend
.\gradlew.bat dbCreate        # macOS/Linux: ./gradlew dbCreate
```

This connects to your PostgreSQL server and creates `RESQCONNECTPEOPLE` if it doesn't exist. Alternatively, run `backend/sql/create_database.sql` in the pgAdmin Query Tool.

## 5. Run migrations

```bash
.\gradlew.bat migrate          # apply pending migrations
.\gradlew.bat migrateStatus    # list applied and pending migrations
```

How the migration system works:

- Files in `backend/sql/migrations/` run in version order (`001_…`, `002_…`). Each one runs inside its own transaction and is recorded, with a checksum, in the `schema_migrations` table.
- Already-applied migrations are skipped, so it is safe to run as often as you like.
- A PostgreSQL advisory lock stops two people or servers from migrating at the same time. The second one waits, then finds nothing to do.
- If a migration fails, it is rolled back completely, is not recorded, and the command exits with an error.
- It works on an empty database, on a database created by the very first version of this project, and on one migrated by the previous version. It uses the same `schema_migrations` table and checksums as the old Node.js migrator, so a database you already migrated is recognised as up to date.

| Migration | What it does | Data safety |
| --- | --- | --- |
| `001_initial_schema.sql` | The original tables. | Creates only missing tables. |
| `002_assignment_uniqueness_preserve_duplicates.sql` | Stops the same volunteer being assigned twice to the same incident. | Existing duplicates are **kept and flagged** (`duplicate_of` points to the oldest copy), never deleted. See "Reconciling duplicate assignments" below. |
| `003_coordinator_and_verifier_roles.sql` | Adds `username` and `is_active`, and replaces the single `admin` role with `coordinator` and `verifier`. | Legacy `admin` accounts become coordinators but are **deactivated**, not deleted. Their password hash and history are untouched. |
| `004_account_status.sql` | Makes sure `is_active` exists on databases migrated by the previous version. | Additive only. |
| `005_performance_indexes.sql` | Indexes for dashboards, filters and the Registered Users page. | Additive only. |
| `006_notifications.sql` | Creates the `notifications` table for in-app notifications, with indexes for each recipient's list and unread count. | Additive only. |
| `007_contact_phone.sql` | Adds the optional `phone` (international format, e.g. `+919876543210`) and `phone_country` columns to `contact_messages`. | Additive only. Existing messages keep an empty phone and show "Not provided" in the admin panel. |
| `008_assignment_workflow.sql` | Adds the `Declined` and `Cancelled` assignment statuses, a `status_reason` and an `updated_at` column, lets a volunteer be re-assigned after declining or a cancellation, and adds indexes for paginated lists. Assignments that were still open on an incident that was **already resolved** are marked `Cancelled` with the reason "Incident INC-… was already resolved". | No rows are deleted. Completed assignments are untouched. To roll back by hand: `UPDATE assignments SET status='Notified' WHERE status IN ('Declined','Cancelled');` then restore the old status check (`Notified, Accepted, In Progress, Completed`) and the old unique index from migration 002. |

### Reconciling duplicate assignments

Only needed if your existing data had duplicates. In pgAdmin:

```sql
SELECT * FROM assignment_duplicates_review;
```

Each row pairs a flagged duplicate with the assignment that was kept. Decide which record is correct, then either delete the duplicate (`DELETE FROM assignments WHERE id = <duplicate_assignment_id>;`) or copy any details you want onto the kept assignment first. Flagged duplicates stay visible in the admin Assignment Tracker with a "Duplicate of ASN-…" note.

### Re-enabling a legacy admin account

Legacy accounts are deactivated because the old project published their password. To re-enable one deliberately:

```sql
UPDATE users SET is_active = TRUE, username = 'legacy-admin' WHERE email = 'admin@gmail.com';
```

## 6. Create the admin accounts (seed)

```bash
.\gradlew.bat seed
```

- Creates the coordinator and verifier accounts from `.env`, with bcrypt-hashed passwords (12 rounds).
- **Running it again never overwrites existing passwords** and never creates duplicates. Existing accounts are reported and left unchanged, and passwords in `.env` are only needed for accounts that don't exist yet.
- To deliberately reset both admin passwords to the values in `.env`: `.\gradlew.bat seedResetPasswords`.
- Existing bcrypt hashes created by the Node.js version are fully compatible, so current users and admins keep their passwords.

## 7. Start the backend

```bash
cd backend
.\gradlew.bat bootRun        # macOS/Linux: ./gradlew bootRun
```

The console shows `RESQCONNECT API listening on 5000` and then `PostgreSQL connection OK`. Stop it with Ctrl+C. After changing Java code, stop it and run `bootRun` again.

Check `http://localhost:5000/api/health`. It returns `{"ok":true,"database":"connected"}`, or HTTP 503 with `"unavailable"` if PostgreSQL can't be reached. The server keeps running and recovers automatically when the database comes back.

## 8. Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. The Webpack dev server serves `public/` (including the hero video), proxies `/api` to `http://localhost:5000`, and supports deep links and page refreshes.

## 9. Build and deploy

```bash
cd frontend
npm run build                 # outputs frontend/dist (JS, CSS, index.html, videos/, images/)
cd ../backend
.\gradlew.bat bootJar         # builds backend/build/libs/resqconnect-api-1.0.0.jar
java -jar build\libs\resqconnect-api-1.0.0.jar   # run from the backend folder; serves the API and frontend/dist together
```

When `frontend/dist` exists, the backend serves it on the same port, with deep-link support, so the whole site runs from `http://localhost:5000`. To deploy:

1. Provision PostgreSQL and set `backend/.env` on the server: a strong `JWT_SECRET`, `CLIENT_ORIGIN` set to your public URL, and `TRUST_PROXY=1` behind Nginx or a hosting proxy.
2. `npm ci` and `npm run build` in `frontend`; then `./gradlew migrate`, `./gradlew seed` and `./gradlew bootJar` in `backend`.
3. Run `java -jar build/libs/resqconnect-api-1.0.0.jar` from the `backend` folder under a service manager (for example systemd or a Windows service wrapper), behind HTTPS. The server shuts down cleanly on Ctrl+C, SIGINT and SIGTERM.

## 10. Homepage hero video

- `frontend/public/videos/resq-hero.mp4` is your uploaded Gemini video, re-encoded once. It is H.264 High profile, 1280×720, 24 fps, with the silent audio track removed and fast-start metadata. That took it from 5.6 MB to 2.8 MB, with SSIM 0.990 against the original (visually identical).
- `frontend/public/images/hero-poster.webp` (24 KB) is the video's first frame, so there is no flash when playback starts.
- `src/public/HeroVideo.jsx` renders the video muted, autoplaying, looping and inline, with no controls and `object-fit: cover`. It sits behind a dark overlay, which sits behind the unchanged hero text and buttons. The video layer ignores clicks.
- If the visitor has "reduce motion" turned on, only the poster image is shown. If the video can't play, the browser shows the poster.
- Webpack copies `public/videos` and `public/images` into the build. The file is served statically (with range requests), not from the database and not as Base64.

## 11. Branding (official logo)

The text-based logo has been removed everywhere. The official transparent PNG logo, `frontend/public/images/resq-connect-logo.png`, is the single visual brand element, rendered by `src/lib/BrandLogo.jsx` in:

| Location | Logo height |
| --- | --- |
| Public navbar | 34 px desktop, 29 px under 640 px (links to Home) |
| Public footer | 44 px, on a small white panel so the dark lettering stays readable on the dark footer |
| User login, registration and admin login cards | 260 px wide |
| User dashboard header (links to Home) and admin dashboard header | 50 px |

- **The file:** only the fully transparent margins around your upload were trimmed (from 866×288 to 819×219). Every visible pixel is identical, transparency is preserved, and the proportions are always kept (`height` set, `width: auto`).
- **Loading:** the logo is preloaded in `index.html`, so it doesn't pop in late.
- **Accessibility:** the image's alt text is "RESQ~CONNECT".
- **Unchanged text:** ordinary uses of the name in headings, sentences, the "Join RESQ~CONNECT" button, the dashboard footer notices and the browser tab title are content, not logos, so they stay.
- **Original CSS:** the old `.brand` rule still exists in `original.css` (kept byte-identical to the reference file) but is no longer used.

## 12. Page layouts

| Page | Public navbar | Public footer | Layout |
| --- | --- | --- | --- |
| Home, About, Services, Contact, Support | Yes | Yes | `layouts/PublicLayout.jsx` |
| User login, User registration, Admin login | No | No | `layouts/AuthLayout.jsx` |
| User portal (`/dashboard/…`) | Own header and sidebar | Own footer | `layouts/UserDashboardLayout.jsx` |
| Admin portal (`/admin/…`) | Original header and sidebar | Original footer | `layouts/AdminDashboardLayout.jsx` |

The public navbar is a floating dark frosted-glass bar, fixed 10 px below the top of the screen with 24 px side margins, 58 px tall (52 px under 640 px), with 16 px rounded corners and an 18 px backdrop blur. It sits above the hero video and gets slightly darker once you scroll. On pages other than Home, the glass is darker and the content is offset so the bar never covers it. Below 900 px wide, the links fold into a menu button that opens a glass dropdown and closes after navigation, on Escape, or on an outside click. Browsers without blur support get a solid fallback.

### About page

`/about` is built in `src/public/AboutPage.jsx` with styles in `src/styles/about-page.css`. Its photos live in `frontend/public/images/about/` (`01_about_hero.png`, `02_mission.png`, `03_vision.png`, `04_values.png`, `06_community_impact.png`, `07_final_cta.png`). The supplied photos are wide, shallow crops (86–237 px tall), so they are shown close to their natural size as sharp bands and framed strips rather than enlarged; behind the hero and closing text a blurred copy of the same photo fills the space. No `05_workflow.png` was supplied, so the workflow section uses the four-step timeline only. To add it later, place the file in the same folder and add an image to the "How it works" section.

### Support Center page

`/support` is built in `src/public/SupportPage.jsx` with styles in `src/styles/support-page.css`. The hero background is `frontend/public/images/support-hero.png` (2172 × 724); all text is real HTML on top of it. On phones the text sits above the image so the laptop and tower stay visible. **Open My Support Tickets** opens `/dashboard/tickets` (signed-out visitors sign in first and come back; signed-in staff see **Go to Admin Portal** instead). The **Common Topics** cards open the same ticket form with the category pre-selected through `?category=` (Account, Emergency Report, Volunteer, Technical Issue).

## 13. In-app notifications

Notifications are stored in PostgreSQL (`notifications` table). They are created by the backend **in the same database transaction** as the event that causes them, so an action and its notification are saved together or not at all. They are **in-app only**: no email, SMS or push messages are sent.

| Event | Who is notified | Clicking opens |
| --- | --- | --- |
| New emergency report | Every active Emergency Coordinator, except the person who filed it | That report in Emergency Reports, highlighted |
| New trained-volunteer application (including a re-application) | Coordinators and Volunteer Verification Admins | That application in Volunteer Verification |
| Verification approved or rejected | The applicant (a rejection includes the reason) | Volunteer Profile |
| New assignment | The assigned volunteer | That assignment in My Assignments |
| Volunteer accepts, declines (with optional reason), starts or completes an assignment | Coordinators | That assignment in Assignments |
| Coordinator cancels an assignment | The assigned volunteer | That assignment in My Assignments |
| Report resolved while assignments were still open | Each affected volunteer (one notification listing their cancelled assignments) | My Assignments |
| Report status changed by a coordinator | The person who filed the report | That report in My Reports |
| New support ticket | Coordinators | That ticket in Support Tickets |
| New public contact message | Coordinators | That message in Contact Messages |
| Admin reply or status change on a ticket | The ticket owner | That ticket in My Support Tickets |

**What happens without a real change:** no notification is created when nothing actually changed, for example setting the same status again. Disabled accounts receive no notifications.

**The bell:** the notification bell in both dashboard headers shows the unread count (up to "99+"). Its dropdown lists the 20 most recent notifications, each with a title, message, relative time and an unread dot. You can:
- click one to mark it read and jump to the item it refers to
- use the check button to mark a single notification read
- use **Mark all as read**

It also has loading, empty and error (with retry) states.

**Live updates:** the bell checks the unread count every 15 seconds, and immediately when you return to the tab. It skips checks while the tab is hidden. Polling is used instead of server-sent events because the browser's `EventSource` cannot send the `Authorization` header that this app's JWT login uses.

**Privacy and persistence:** you can only ever see or change your own notifications (the API answers 404 for anyone else's). Read status is saved in the database, so it persists across refreshes and sign-ins.

## 14. Dashboard layout

Both the admin and user dashboards share one frame (`src/components/DashboardFrame.jsx`):

- **Colours:** the brand palette lives in `src/styles/brand.css` (primary `#03591B`). It overrides the variables used by `original.css`, so the original stylesheet itself is unchanged. Dashboard styling is in `src/styles/dashboard-theme.css`.
- **Header:** fixed at the top, white with a thin green accent line. It shows the logo, the current page title, the notification bell, an initials avatar with the account name and role, and Logout.
- **Sidebar:** forest-green (`#03591B`), fixed below the header, and it scrolls independently when its menu is taller than the screen. The active page is a white pill with green text. On desktop the **Collapse** button at the bottom shrinks it to an 80 px icon rail (the choice is remembered in this browser).
- **Content:** offset so nothing is hidden under the header or sidebar.
- **Icons:** every sidebar item has a React Icons icon, with matching hover and active states. The active page is also announced to screen readers.
- **Phones and tablets (860 px and narrower):** the sidebar becomes a slide-in drawer opened by a menu button. It has a dark overlay and a close button, closes on Escape or after navigation, and keeps page scrolling locked while open. Keyboard focus moves into the drawer and back to the menu button.
- **Narrow phones (600 px and narrower):** the name and role hide to save space.

## 15. Assignment workflow

The server is the only source of truth for assignment status. Every change is checked against the rules below and saved in a transaction together with its notification.

| From | Volunteer (assigned user) can move to | Coordinator can move to |
| --- | --- | --- |
| Notified | Accepted, Declined | Cancelled |
| Accepted | In Progress, Declined | Cancelled |
| In Progress | Completed | Cancelled |
| Completed, Declined, Cancelled | — (final) | — (final) |

- New assignments always start as **Notified**. Asking to create one in any other status returns 400.
- Coordinators cannot accept, start or complete work on a volunteer's behalf (403). Moves that skip a step or go backwards return 409. Another user's assignment returns 404.
- A volunteer who declined, or whose assignment was cancelled, can be assigned to the same incident again.
- **Resolving an emergency report** cancels its assignments that are still Notified, Accepted or In Progress, with the reason "Incident INC-… was resolved", and notifies those volunteers. Completed assignments are kept as history. Nothing is deleted.

## 16. Roles and permissions

| Area | Emergency Coordinator | Volunteer Verification Admin | Registered user |
| --- | --- | --- | --- |
| Admin login (`/admin/login`, role + username + password) | ✔ | ✔ | — |
| Emergency Dashboard / Verification Dashboard | Emergency Dashboard (incl. Total Registered Users) | Verification Dashboard | — |
| Emergency Reports | ✔ | — | Own reports |
| Volunteer Directory | ✔ | — | Own profile |
| Volunteer Verification | ✔ | ✔ | — |
| Assignments | ✔ create and cancel | — | Own (accept, decline, start, complete) |
| Relief Coordination | ✔ | — | — |
| Reports & Analytics | ✔ | — | — |
| **Registered Users** | ✔ | — | — |
| Support Tickets | ✔ reply and set status | — | Create and view own |
| Contact Messages | ✔ | — | — |

The backend enforces every rule. Disabled accounts (`is_active = false`) cannot sign in, and any token they already hold stops working.

## 17. Registered Users management

The **Registered Users** page (`/admin/users`, coordinator only):

- **Summary cards:** total registered users, new in the last 7 and 30 days, and how many have a volunteer profile.
- **Table:** User ID, Full Name, Email Address, Phone Number (from the volunteer profile, when there is one), Account Role, Volunteer Profile, Registration Date and Account Status.
- **Search and filters:** search by name or email, plus filters for role, volunteer profile and account status, and a choice of 10, 20, 50 or 100 rows per page.
- **Paging and states:** the server does the paging and shows the total record count, with loading, empty, error and retry states. On small screens the table scrolls sideways inside its panel.

"Total Registered Users" on the Emergency Dashboard counts only `role = 'user'` accounts, so admin accounts are excluded, and it updates with every new registration.

## 18. API

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/register` | Public (rate limited) |
| POST | `/api/auth/login` | Public, email + password (rate limited) |
| POST | `/api/auth/admin-login` | Public, role + username + password (rate limited) |
| GET | `/api/auth/me` | Signed in |
| POST | `/api/contact` | Public (10 per 15 min per IP) |
| GET | `/api/contact?page=&pageSize=&search=` | Coordinator |
| GET | `/api/admin/summary` | Coordinator, Verifier |
| GET | `/api/admin/users?page=&pageSize=&search=&role=&volunteer=&status=` | Coordinator. Returns `{data, pagination:{page,pageSize,total,totalPages}}` with no password, hash or token fields. |
| GET | `/api/admin/users/stats` | Coordinator |
| GET | `/api/admin/analytics` | Coordinator. Counts by status for incidents and assignments, plus volunteer totals. |
| GET, POST | `/api/incidents?page=&pageSize=&search=&status=&urgency=` | Coordinator (all), User (own). `status=open` means not resolved. |
| PATCH | `/api/incidents/:id` | Coordinator. Resolving returns `cancelled_assignments`. |
| GET | `/api/volunteers?page=&pageSize=&search=&category=&availability=&verification=&eligible=true` | Coordinator, Verifier (all); User (own) |
| POST | `/api/volunteers` | User (re-apply allowed after a rejection) |
| PATCH | `/api/volunteers/me` | User |
| PATCH | `/api/volunteers/:id/verify` | Coordinator, Verifier |
| GET | `/api/verification-history?page=&pageSize=` | Coordinator, Verifier |
| GET | `/api/assignments?page=&pageSize=&search=&status=&incident_id=` | Coordinator (all), User (own). `status=open` means Notified, Accepted or In Progress. |
| POST | `/api/assignments` | Coordinator (always created as Notified) |
| PATCH | `/api/assignments/:id` | Body `{status, reason?}`. See "Assignment workflow" for who may make which change. |
| GET, POST | `/api/resources?page=&pageSize=&search=&priority=&incident_id=` | Coordinator |
| GET | `/api/tickets?page=&pageSize=&search=&status=&category=` | Coordinator (all), User (own) |
| POST | `/api/tickets` | User. `category` must be Account, Emergency Report, Volunteer, Technical Issue or Other. |
| PATCH | `/api/tickets/:id` | Coordinator |
| GET | `/api/notifications?limit=` | Signed in (own notifications only), returns `{data, unread_count}` |
| GET | `/api/notifications/unread-count` | Signed in |
| PATCH | `/api/notifications/:id/read` | Signed in (own notification only) |
| PATCH | `/api/notifications/read-all` | Signed in |

**Pagination:** list endpoints return `{data, pagination:{page,pageSize,total,totalPages}}` when `page` or `pageSize` is given (`pageSize` is 5, 10, 20, 50 or 100; a page past the end returns the last page). Without them they return a plain array as before, capped at the 500 newest rows (the `X-Result-Truncated: true` header is set when more exist). Search terms are matched literally (`%` and `_` have no special meaning) and all values are sent as SQL parameters.

Errors are always JSON `{ "error": "…" }`. Stack traces are never sent to the browser. Validation errors return 400, missing or expired sessions 401, wrong role 403, duplicates 409, and database outages 503.

## 19. How the original design is preserved

- `frontend/src/styles/original.css` is a byte-for-byte copy of the `<style>` block in the reference file (only the line endings differ). Do not edit it.
- `frontend/src/styles/portal-additions.css` holds the few extra rules the React portals need (including logo sizing), using only the original CSS variables.
- The only intentional visual change to the original admin design is that the text logo in the header and the login card is now the official logo image.
- `frontend/src/styles/public-site.css` holds the public-website styles. Every rule is scoped under `.site`, so nothing leaks into the portals.

**Wording changed for technical accuracy** (the original said data was stored in the browser):

| Location | Original | Now |
| --- | --- | --- |
| Assignments notice | "Assignments are stored only in this browser. …" | "Assignments are stored in the RESQ~CONNECT database. …" |
| Reports & Analytics subtitle | "A summary of the demonstration data stored in this browser." | "A summary of the data stored in the RESQ~CONNECT database." |
| Reports & Analytics notice | "These figures are not connected to a live database and …" | "These figures come from the RESQ~CONNECT project database and …" |

**Other behaviour notes:**

- Volunteer IDs keep the original format (`RC-T-0002`) but use the database ID.
- "Urgent" uses the red badge.
- Relief Coordination lists only open incidents.
- The old decorative hero illustration was removed to make room for the video: its orbit rings, heart icon, and three floating labels ("Emergency reports", "Volunteer network", "Relief coordination"). Those three topics are still covered in the "One connected response ecosystem" section directly below.

## 20. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Could not reach PostgreSQL` | Start the PostgreSQL service (Windows: Services → postgresql-x64-NN), and check the host and port in `DATABASE_URL`. |
| `PostgreSQL rejected the username or password` | Fix the credentials in `DATABASE_URL`, and URL-encode special characters in the password. |
| `The database in DATABASE_URL does not exist` | Run `.\gradlew.bat dbCreate`, or run `sql/create_database.sql` in pgAdmin. |
| `The database schema is out of date` (from seed) | Run `.\gradlew.bat migrate` first. |
| Seed says `Password unchanged` | This is expected. To change admin passwords deliberately, use `.\gradlew.bat seedResetPasswords`. |
| `Invalid username or password for the selected role.` | Make sure the selected role matches the account: the coordinator signs in as "Emergency Coordinator", the verifier as "Volunteer Verification Admin". |
| Frontend shows "Request failed" or 503 | The backend isn't running or the database is down. Check `http://localhost:5000/api/health`. |
| `Too many sign-in attempts` | Login and registration allow 30 requests per 15 minutes per IP. Wait, or restart the backend in development. |
| Hero shows only the still image | Either "reduce motion" is turned on in your operating system (this is intended), or the browser can't play H.264. All current Chrome, Edge, Firefox and Safari versions can. |
| Notification bell never shows anything | Run `.\gradlew.bat migrate` to create the `notifications` table, then restart the backend. Notifications only exist for events that happen after this update. |
| Port 5000 or 5173 already in use | Change `PORT` in `backend/.env`, or the `devServer.port` in `webpack.config.js` together with `CLIENT_ORIGIN`. |
| PowerShell blocks `npm` scripts | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npm.cmd`. |
| `'java' is not recognized` or `JAVA_HOME is not set` | Install JDK 17 or 21 and reopen the terminal. If it still fails, set `JAVA_HOME` to the JDK folder (for example `C:\Program Files\Eclipse Adoptium\jdk-21…`). |
| `Unsupported class file major version` or Gradle refuses your Java | Use JDK 17 or 21. Gradle 8.14 does not run on Java 25. |
| Gradle cannot download dependencies | The first build needs internet access to `services.gradle.org` and Maven Central. Behind a college proxy, set the proxy in `%USERPROFILE%\.gradle\gradle.properties` (`systemProp.https.proxyHost=…`, `systemProp.https.proxyPort=…`). |
| `Port 5000 was already in use` | Another backend (for example the old Node.js one) is still running. Stop it, or change `PORT` in `backend/.env`. |

## 21. Java backend design

- **Spring Boot** runs the embedded Tomcat web server, the HikariCP connection pool and bcrypt (Spring Security Crypto). Configuration lives in `config/ServerConfig.java`.
- **One request pipeline** (`http/App.java`) handles every request in the same order as the old Express app: security headers (same policy as Helmet), CORS, JSON body parsing (50 KB limit), the API routes, then the built frontend with deep-link support. Routes are declared in one place per area (`api/IncidentRoutes.java`, `api/AssignmentRoutes.java`, …), for example `router.patch("/api/incidents/:id", security.auth, Security.allow(COORDINATOR), this::update)`.
- **Database access** uses plain JDBC with SQL parameters (`$1`, `$2`, … are converted to JDBC `?` placeholders). No ORM is used, so the SQL is exactly the SQL that ran before, and each multi-step change runs in one transaction.
- **Validation** (`util/Validator.java`) returns the same field-level error messages as before, which the forms display.
- **JWT** (`api/Jwt.java`) uses HS256 with the issuer `resqconnect` and an 8-hour lifetime, so tokens are interchangeable with the previous backend.

## 22. Verification

See `docs/VERIFICATION.md` for the full test report: what was run, the results, and what could not be tested in the build environment.

## Notes

This is an academic demonstration, not a live emergency dispatch system. Verification reviews self-entered certificate references, and ID documents are not uploaded. Assignments do not send notifications. The project does not implement password reset, file uploads, production monitoring or email delivery.
