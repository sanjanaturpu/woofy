# woofy backend

FastAPI now contains the first PostgreSQL-backed API foundation for accounts,
pets, appointments, veterinarian schedules, medical records, vaccinations,
notifications, conversations/messages, profiles and administrator actions.
The existing Ollama-powered woofy AI endpoint has been retained.

> **Integration status:** the existing login, registration and dashboard now
> call the FastAPI endpoints for authentication and the main pet-care records.
> `localStorage` is used as a short-lived rendering cache, not as the source of
> truth for those records. Run the end-to-end checks in section 8 with your own
> PostgreSQL database before treating the full application as verified.

## 1. Create the PostgreSQL database

Install PostgreSQL for Windows, then open pgAdmin or SQL Shell (psql) and
create a database named `woofy`.

In pgAdmin: right-click **Databases** → **Create** → **Database** → enter
`woofy` → **Save**.

## 2. Configure environment variables

Copy the root `.env.example` file to `.env` and edit the values:

- `DATABASE_URL`: your PostgreSQL username, password, host, port and database.
- `WOOFY_JWT_SECRET`: a long, private random value used to sign login tokens.
- `WOOFY_ADMIN_SETUP_KEY`: a separate private key required to create the first
  administrator.
- Ollama variables can remain as shown if you use the existing local model.

Never commit `.env` to Git or share its secrets.

## 3. Install Python dependencies

Open the project folder in VS Code, then in its terminal run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-ai.txt
```

If PowerShell blocks virtual-environment activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 4. Start the API

From the project root:

```powershell
uvicorn backend.main:app --reload --port 8000
```

Open:

- Health check: `http://127.0.0.1:8000/api/health`
- Swagger API docs: `http://127.0.0.1:8000/docs`

The health check reports whether PostgreSQL is connected. On first startup,
SQLAlchemy creates the development tables automatically. This is a local
development convenience; a migration workflow (Alembic) must be introduced
before production deployment.

## 5. Initial administrator provisioning

The first administrator is not created through public registration. The
backend exposes `POST /api/admin/bootstrap`, and it requires the
`X-Woofy-Setup-Key` header to match `WOOFY_ADMIN_SETUP_KEY` in `.env`.
The endpoint refuses to create another bootstrap administrator once one
already exists. Additional administrator accounts can only be created through
the authenticated administrator endpoint `POST /api/admin/users`.

The login page no longer displays a public administrator-setup link. The
administrator setup page is retained as a project file, but its old browser
storage flow is not the secure provisioning method; use the backend endpoint
until the frontend setup form is migrated.

## 6. Current API groups

- `/api/auth/*` — registration, login and current authenticated user.
- `/api/admin/*` — administrator user management and announcements.
- `/api/pets` — pet profile access and management.
- `/api/vets` — approved veterinarian directory and clinic schedules.
- `/api/appointments` — booking and role-checked appointment updates.
- `/api/medical-records` and `/api/vaccinations` — clinical records.
- `/api/conversations/*` — parent/vet conversations and messages.
- `/api/notifications` — persisted notifications and read state.
- `/api/profile` — account profile and clinic details.
- `/api/ai/chat` — existing local Ollama pet-care assistant.

Protected endpoints require `Authorization: Bearer <access_token>`. The backend
checks the authenticated account and role before allowing access. Passwords
are hashed with Argon2 before being stored.

## 7. Important remaining work

- Verify all three roles and all API-backed workflows end-to-end in a browser.
- Move remaining convenience-only UI state (for example reminder display
  state) fully into persisted notification workflows where required.
- Add Alembic migrations and production deployment configuration.
- Add automated API tests and run end-to-end tests with a real PostgreSQL
  instance.
- Add a background scheduler for appointment/vaccination reminders. Persisted
  notifications exist, but scheduled reminder delivery is not yet implemented.

The database-backed API foundation is not yet a production deployment. The
frontend integration, migrations, automated tests and background reminders
must be completed before the application is presented as a fully connected
multi-user platform.

## 8. Frontend integration smoke test

1. Start PostgreSQL and confirm `/api/health` reports `database: connected`.
2. Start the API with `python -m uvicorn backend.main:app --reload --port 8000`.
3. Open `index.html` through VS Code Live Server (use port 5500, 5501, 5502 or 5503). Do not open the HTML file directly with `file://`.
4. Register a Pet Parent account (password must be at least 10 characters), then log in.
5. Add a pet and verify a row appears in the PostgreSQL `pets` table.
6. Register a Veterinarian account, approve it while logged in as Administrator, then log in as the veterinarian and publish clinic hours.
7. As the Pet Parent, book an appointment. Verify the row in `appointments`.
8. As the Veterinarian, accept the appointment and add a medical record and vaccination. Verify both PostgreSQL tables and then log in as the Pet Parent to see them.
9. Test parent/vet messages, persisted notifications and Woofy AI. AI requires Ollama to be running with the configured model.

The project has been syntax-checked, but these live browser/PostgreSQL workflow tests still need to be run on the development computer.
