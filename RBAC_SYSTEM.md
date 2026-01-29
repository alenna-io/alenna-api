# Access Control Architecture

## 🎯 Overview
Simplified, backend-enforced access control built around:
- **System roles** (`SUPERADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `PARENT`, `STUDENT`)
- **Feature modules** (`students`, `users`, `schools`, `configuration`)
- **School-level feature toggles** (`school_modules`)
- **Role-module assignments per school** (`roles_modules_school`)
- **Static capability map** that lists which role can perform which actions in a module

The frontend never assumes access—it only reflects what the backend exposes.

---

## 📊 Database Structure

| Table                  | Purpose                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `roles`                | Defines reusable system roles. Can be extended with school-specific roles later.                      |
| `user_roles`           | Many-to-many link between users and roles (multi-role support).                                       |
| `modules`              | Catalog of top-level feature areas. Each row has a stable `key`.                                      |
| `school_modules`       | Marks which modules are enabled for a given school (licensing/feature flags).                         |
| `roles_modules_school` | Grants a role access to a module within a specific school. This replaces per-user module assignments. |
| `user_students`        | Links parents to their children for ownership checks.                                                 |

No dynamic permission rows are required—allowed actions live in code and can evolve quickly.

---

## 👥 Roles & Capabilities

Capabilities are declared in `src/core/app/use-cases/auth/permission-map.ts`.

- **SUPERADMIN** – All actions across all modules. Operates inside the special `Alenna` school tenant.
- **SCHOOL_ADMIN** – Full academic and user management for their school, except global school configuration updates.
- **TEACHER** – Manage students, projections, and PACEs. Read-only access to basic school info and calendar.
- **PARENT** – View-only access scoped to their linked students.
- **STUDENT** – View-only access to their own profile and projections (future-ready).

Actions keep the existing naming convention (`students.read`, `projections.update`, etc.) so APIs and UI checks remain familiar.

---

## 🔐 Permission Flow

```
requirePermission('students.read')
  ↓
1. Resolve static capability definition → module = students
2. Load user context (roles, school, linked students)
3. Ensure module is enabled for the school (`school_modules`)
4. Ensure user’s roles are mapped to the module for that school (`roles_modules_school`)
5. Check the role’s allowed actions
6. Apply ownership rules for `*.readOwn` / `*.updateOwn`
  ↓
✅ Continue OR ❌ 403 Forbidden
```

Ownership enforcement:
- Parents must be linked to the student via `user_students`
- Students can only see their own record
- Teachers and school admins operate at the school level

---

## 🧱 Backend Building Blocks

- `CheckPermissionUseCase` – Central service that enforces the flow above.
- `permission.middleware.ts` – Express middleware wrappers (`requirePermission`, `requireAnyPermission`, etc.).
- `GetUserInfoUseCase` – Returns roles, flattened permission strings, and module/action summaries for the frontend.
- `GetUserModulesUseCase` – Provides module/action details for UI feature toggles.

All enforcement happens server-side; the client simply consumes the capability payload to conditionally render.

---

## 🏫 Seeding & Defaults

- `seed-rbac.ts` creates the canonical roles and modules with stable keys.
- `seed.ts`
  - Enables modules per school (`school_modules`)
  - Grants roles access via `roles_modules_school`
  - Seeds demo users (school admin, teacher, parent, student) and a super admin under the `Alenna` tenant

Need a fresh start? Run `pnpm prisma migrate reset` to drop, recreate, and reseed the database with the new structure.

---

## 🎨 Frontend Integration

- `GET /api/v1/auth/info` → returns `permissions` (string list) + `modules` (actions per module)
- `GET /api/v1/modules/me` → returns detailed module/action payload for feature gating
- Client helpers simply check `permissions.includes('students.create')` or use module action arrays. No direct business rules live on the frontend.

---

## ✅ Why This Works

- Keeps enforcement authoritative and centralized
- Removes per-user toggles—roles determine module visibility
- Keeps future extensibility (custom roles, new modules) without schema churn
- Maintains compatibility with existing permission strings to reduce UI churn

Your access control is now leaner, easier to reason about, and still ready for future growth. 🎉
