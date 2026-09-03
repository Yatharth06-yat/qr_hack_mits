# QR Team Management & Verification System

A web-based **QR Team Management and Checkpoint Verification System** designed to manage registered teams, team members, QR-based identification, and checkpoint verification using **Supabase**.

The system helps organizers quickly identify teams, verify participants, update checkpoint status, and maintain team-related information in a centralized database.

## 🚀 Features

* 🏷️ **Team Registration & Management**
* 👥 **Team Member Management**
* 📱 **QR Code Based Team Identification**
* ✅ **Checkpoint Verification**
* 🔄 **Real-time Team Status Updates**
* 🗄️ **Supabase PostgreSQL Database**
* 🔐 **Row Level Security (RLS)**
* 📊 **Team & Verification Data Management**
* ⚡ Fast and lightweight web interface
* 📱 Responsive design

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │     Web Interface   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   QR Code Scanner   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Team Verification │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Supabase       │
                    │    PostgreSQL DB    │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌───────────┐        ┌──────────────┐
              │   teams   │        │ team_members │
              └───────────┘        └──────────────┘
```

## 🗄️ Database Structure

### `teams`

Stores information about registered teams.

Typical fields include:

| Field          | Description              |
| -------------- | ------------------------ |
| `id`           | Unique team UUID         |
| `team_code`    | Unique team identifier   |
| `team_name`    | Name of the team         |
| `college_name` | College/institution name |
| `leader_name`  | Team leader              |
| `leader_phone` | Leader contact           |
| `leader_email` | Leader email             |
| `status`       | Current team status      |
| `created_at`   | Registration timestamp   |

### `team_members`

Stores individual members associated with a team.

| Field     | Description       |
| --------- | ----------------- |
| `id`      | Unique member ID  |
| `team_id` | Related team UUID |
| `name`    | Member name       |
| `email`   | Member email      |
| `phone`   | Member contact    |
| `role`    | Team/member role  |

## 🔐 Supabase Row Level Security

RLS is enabled on both tables:

```sql
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
```

The system includes policies for:

* `SELECT` — Read team information
* `INSERT` — Add teams and members
* `UPDATE` — Update verification/checkpoint information

Example:

```sql
CREATE POLICY "Allow public read teams"
ON public.teams
FOR SELECT
USING (true);
```

> ⚠️ **Security Note:** The current development policies allow broad public access. For a production deployment, replace `USING (true)` and `WITH CHECK (true)` with authenticated and role-based policies.

## 📱 QR Verification Flow

```text
Team Registration
       ↓
Team Code Generated
       ↓
QR Code Generated
       ↓
QR Code Scanned
       ↓
Team Found in Supabase
       ↓
Team Information Displayed
       ↓
Checkpoint / Verification Updated
       ↓
Status Saved
```

## 🛠️ Technologies

* **HTML5**
* **CSS3**
* **JavaScript**
* **QR Code**
* **Supabase**
* **PostgreSQL**
* **Row Level Security (RLS)**

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <project-folder>
```

### 2. Create a Supabase project

Create a project on Supabase and open the **SQL Editor**.

### 3. Create the database tables

Run the project's database SQL in the Supabase SQL Editor.

### 4. Configure Supabase

Add your Supabase project URL and public/anon key to the application configuration.

Example:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

**Never expose a Supabase service-role key in frontend code.**

### 5. Configure RLS

Enable RLS and create the required policies.

If policies already exist, use:

```sql
DROP POLICY IF EXISTS "Allow public read teams"
ON public.teams;
```

before recreating them.

### 6. Run the application

For a simple static project, open the application through a local development server.

Example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## 📂 Suggested Project Structure

```text
qr-team-management/
│
├── index.html
├── scanner.html
├── dashboard.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── scanner.js
│   └── supabase.js
│
├── assets/
│   └── images/
│
├── database/
│   └── schema.sql
│
└── README.md
```

## 🔄 Checkpoint Management

The system can be extended to support multiple checkpoints:

```text
Checkpoint 1
     ↓
Checkpoint 2
     ↓
Checkpoint 3
     ↓
Checkpoint 4
     ↓
Final Verification
```

Each checkpoint can store:

* Verification status
* Verification timestamp
* Checkpoint identifier
* Team identifier
* Optional verifier information

## 🎯 Use Cases

This system can be used for:

* Hackathons
* College events
* Technical fests
* Competitions
* Workshops
* Team-based registrations
* Event entry verification
* Multi-stage checkpoint systems

## 🔒 Security Recommendations

For production deployment:

1. Enable Supabase RLS.
2. Avoid using the service-role key in frontend code.
3. Use authenticated users for organizers/admins.
4. Restrict `INSERT` and `UPDATE` permissions.
5. Validate QR/team IDs on the server/database side.
6. Add role-based access for administrators and verifiers.
7. Store an audit log for checkpoint updates.
8. Validate all user-submitted data.

## 🐛 Troubleshooting

### Policy already exists

If Supabase returns:

```text
ERROR: 42710:
policy "Allow public read teams"
for table "teams" already exists
```

Use:

```sql
DROP POLICY IF EXISTS "Allow public read teams"
ON public.teams;
```

Then recreate the policy.

### Null value violates NOT NULL constraint

Example:

```text
null value in column "college_name"
violates not-null constraint
```

Make sure the registration form sends a valid `college_name` before inserting the team.

## 📈 Future Improvements

* [ ] Admin authentication
* [ ] Role-based access control
* [ ] QR code generation dashboard
* [ ] QR scan history
* [ ] Checkpoint analytics
* [ ] Duplicate scan detection
* [ ] Export teams to CSV/Excel
* [ ] Real-time dashboard
* [ ] Attendance tracking
* [ ] Audit logs
* [ ] Offline QR verification
* [ ] PWA/mobile support

## 👨‍💻 Project

**QR Team Management & Verification System**

Built for efficient team registration, QR identification, and checkpoint management for large-scale events.

---

### License

This project is intended for educational, event-management, and hackathon use.
