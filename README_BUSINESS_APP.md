# Farmer Mobile App - Business Management System

Complete Angular frontend for managing farmers/sub-owners and their inventory and sales.

## Project Overview

A role-based Angular 17 application with two user roles:
1. **Main Owner (Admin)** — Can view all sub-owners and their items/sales
2. **Sub Owner** — Can manage items (add, view) and record sales

## Project Structure

```
src/app/
├── core/                          # Singleton services & guards
│   ├── auth.service.ts            # Authentication logic
│   ├── auth.guard.ts              # Check if user is logged in
│   └── role.guard.ts              # Check user role for routes
├── shared/                        # Reusable components & services
│   ├── components/
│   │   ├── header/                # Header with user info & logout
│   │   ├── sidebar/               # Navigation menu (role-aware)
│   │   └── toast/                 # Toast notifications
│   ├── services/
│   │   └── toast.service.ts       # Toast message management
│   └── shared.module.ts
├── models/                        # TypeScript interfaces
│   ├── user.model.ts
│   ├── item.model.ts
│   └── sale.model.ts
├── services/                      # API communication services
│   ├── auth.service.ts
│   ├── item.service.ts
│   ├── sale.service.ts
│   └── user.service.ts
├── auth/                          # Login feature module
│   ├── login/
│   │   ├── login.component.ts
│   │   └── login.component.html
│   ├── auth-routing.module.ts
│   └── auth.module.ts
├── main-owner/                    # Main Owner feature module
│   ├── dashboard/
│   │   └── main-owner-dashboard.component.ts
│   ├── sub-owner-details/
│   │   └── sub-owner-details.component.ts
│   ├── main-owner-routing.module.ts
│   └── main-owner.module.ts
├── sub-owner/                     # Sub Owner feature module
│   ├── items/
│   │   ├── item-list.component.ts
│   │   └── item-form.component.ts
│   ├── sales/
│   │   └── sales-form.component.ts
│   ├── sub-owner-routing.module.ts
│   └── sub-owner.module.ts
├── app.component.ts/html/scss
├── app.routes.ts
├── app.config.ts
└── main.ts
```

## Components

### Shared (Reusable)
- **HeaderComponent** — Displays app name, user info (name & role), logout button
- **SidebarComponent** — Role-aware navigation menu
- **ToastComponent** — Popup notifications (success, error, info)

### Auth
- **LoginComponent** — Email/password form with role-based redirect

### Main Owner (Admin)
- **MainOwnerDashboardComponent** — Lists all sub-owners with links to view details
- **SubOwnerDetailsComponent** — Shows items and sales for a specific sub-owner

### Sub Owner
- **ItemListComponent** — Lists user's items with action links
- **ItemFormComponent** — Form to add new item (name, unit, price)
- **SalesFormComponent** — Form to record a sale (select item, enter quantity, auto-calc total)

## Routing Structure

```
/login                                    → LoginComponent
/main-owner                               → Dashboard (role-guard: MAIN_OWNER)
  /main-owner                             → MainOwnerDashboardComponent
  /main-owner/sub-owner/:id               → SubOwnerDetailsComponent
/sub-owner                                → Sub Owner area (role-guard: SUB_OWNER)
  /sub-owner/items                        → ItemListComponent
  /sub-owner/items/new                    → ItemFormComponent
  /sub-owner/sales/new                    → SalesFormComponent
/ or /**                                  → Redirect to /login
```

## Models (Interfaces)

### User
```ts
export type Role = 'MAIN_OWNER' | 'SUB_OWNER';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  token?: string;
}
```

### Item
```ts
export interface Item {
  id: string;
  name: string;
  unit: string;           // e.g., 'kg', 'piece'
  price: number;          // Set by sub-owner
  ownerId: string;        // Sub-owner who created it
  createdAt?: string;
}
```

### Sale
```ts
export interface Sale {
  id: string;
  itemId: string;
  ownerId: string;        // Sub-owner
  quantity: number;
  unit: string;
  totalPrice: number;     // price × quantity
  date: string;
}
```

## Services & APIs

All services use **HttpClient** with dummy API endpoints:

### AuthService
- `login(email, password)` → `POST /auth/login`
- `logout()` — Clears token & current user
- `currentUser$` — Observable of logged-in user

### ItemService
- `create(item)` → `POST /items`
- `getByOwner(ownerId)` → `GET /items?ownerId=...`
- `getAll()` → `GET /items`

### SaleService
- `create(sale)` → `POST /sales`
- `getByOwner(ownerId)` → `GET /sales?ownerId=...`

### UserService
- `getByRole(role)` → `GET /users?role=...`
- `get(id)` → `GET /users/:id`

### ToastService
- `success(message)`
- `error(message)`
- `info(message)`
- Auto-dismisses after 3 seconds

## Guards

### AuthGuard
- Checks if user is logged in (`currentUserValue` is not null)
- Redirects to `/login` if not authenticated

### RoleGuard
- Checks if user's role matches route's required role (from `route.data['role']`)
- Redirects to `/login` if role doesn't match

## Best Practices Implemented

1. **Modules**
   - Core module for singletons (AuthService, Guards)
   - Shared module for reusable components (Header, Sidebar, Toast)
   - Feature modules (Auth, MainOwner, SubOwner) lazy-loaded via routes

2. **Services**
   - Centralized API communication via HttpClient
   - Clean separation of concerns
   - `providedIn: 'root'` for singleton injection

3. **Routing**
   - Lazy loading of feature modules (`loadChildren`)
   - Type-safe route data via `route.data['role']`
   - Single canActivate guard chain for auth + role checks

4. **Standalone Components**
   - Modern Angular 17 approach (no NgModule declarations)
   - Inline templates for small components
   - External templates for larger components

5. **Reactive Forms**
   - FormBuilder for validation
   - Typed form groups
   - Error handling with visual feedback

6. **Observables**
   - RxJS for async operations
   - Async pipe in templates for subscription management
   - `finalize` for cleanup (e.g., disable loading button)

7. **Type Safety**
   - Interfaces for all data models
   - Strong typing in services and components
   - Strict TypeScript compiler settings

8. **UX**
   - Toast notifications for user feedback
   - Loading states on buttons during requests
   - Role-based navigation in sidebar
   - Clean, responsive forms

9. **Security (Frontend)**
   - Token stored in localStorage (note: consider secure storage for production)
   - AuthGuard prevents access to protected routes
   - RoleGuard enforces role-based access
   - **[Backend must validate all permissions and tokens]**

10. **State Management**
    - Simple service-based state (BehaviorSubject for currentUser)
    - No NgRx yet (add if complexity grows)

## Running the App

```bash
npm install
npm start
```

Navigate to `http://localhost:4200`. App will load with login page.

### Demo Credentials
Currently dummy API. For testing, you can mock the AuthService response or integrate a real backend.

## Extending the App

### Add New Feature (e.g., Reports)
1. Generate module: `ng generate module reports --routing`
2. Generate component: `ng generate component reports/dashboard`
3. Add route in `reports-routing.module.ts`
4. Add lazy route in `app.routes.ts`
5. Add navigation link in `sidebar.component.ts`

### Add New Model
1. Create interface in `models/new-entity.model.ts`
2. Create service in `services/new-entity.service.ts` with CRUD methods
3. Create components as needed

### Mock Backend
Replace dummy API URLs with your backend or use `angular-in-memory-web-api` for testing.

## Key Files

- **app.routes.ts** — Main routing configuration
- **app.config.ts** — Dependency injection providers (HttpClient, Router)
- **app.component.ts** — Root component with Header, Sidebar, Toast
- **core/role.guard.ts** — Role-based route protection
- **auth.service.ts** — User authentication state

## Technology Stack

- **Angular 17** — Latest features (standalone, control flow syntax)
- **TypeScript 5.2** — Type-safe development
- **RxJS 7.8** — Reactive programming
- **Angular Forms** — Reactive forms with validation

---

**Created:** February 27, 2026  
**Author:** GitHub Copilot  
**Status:** Ready for development
