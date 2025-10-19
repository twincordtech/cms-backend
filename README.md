# CMS Application Backend (Server)

## Overview
This is the **backend** for the CMS Application, built with Node.js, Express, and MongoDB. It provides a secure, scalable, and modular REST API for managing all content, users, media, newsletters, and more.

---

## Features
- **Authentication & Authorization:** Secure JWT-based login, registration, password reset, and role-based access control.
- **Content Management:** CRUD for pages, blogs, sections, and components with versioning and draft/publish workflows.
- **Media Management:** File uploads, storage, and retrieval for images and documents.
- **Newsletter System:** Create, schedule, and send newsletters with subscriber management.
- **Lead & Inquiry Management:** Capture, track, and manage leads and user inquiries.
- **User Management:** Admin/user roles, profile management, and activity logging.
- **Notifications:** Real-time and persistent notifications for system events.
- **Audit Trails:** Activity logging for compliance and debugging.
- **Validation & Security:** Input validation, rate limiting, CORS, and secure error handling.

---

## Tech Stack
- **Node.js** (Express.js framework)
- **MongoDB** (Mongoose ODM)
- **JWT** (Authentication)
- **Nodemailer** (Email)
- **Joi** (Validation)
- **Multer** (File uploads)
- **Day.js** (Date/time)
- **Winston** (Logging, recommended)

---

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (local or Atlas)

### Installation
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd cms-application/server
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your values (see below).
4. **Start the development server:**
   ```bash
   npm run dev
   ```
5. **API will be available at** [http://localhost:5000/api](http://localhost:5000/api)

---

## Environment Variables (`.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cms
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password
EMAIL_FROM=noreply@FentroCMS.com
```

---

## Complete Folder Structure
```
server/
  ├── app.js                  # Express app setup and middleware registration
  ├── config/
  │   ├── componentTypes.js   # Component type definitions for dynamic content
  │   └── db.js               # MongoDB connection logic
  ├── controllers/            # Business logic for each feature/module
  │   ├── activityController.js      # Activity log endpoints
  │   ├── authController.js         # Auth endpoints (register, login, etc.)
  │   ├── blogController.js         # Blog CRUD endpoints
  │   ├── componentController.js    # Dynamic component endpoints
  │   ├── formsController.js        # Form builder endpoints
  │   ├── inquiryController.js      # Inquiry endpoints
  │   ├── leadController.js         # Lead endpoints
  │   ├── notificationController.js # Notification endpoints
  │   ├── pageController.js         # Page CRUD endpoints
  │   ├── pageInstanceController.js # Page instance endpoints
  │   ├── sectionController.js      # Section endpoints
  ├── index.js                # Server entry point (starts app.js)
  ├── middleware/             # Express middleware
  │   ├── activityLogger.js   # Logs user actions for audit trails
  │   ├── async.js            # Async error handler wrapper
  │   ├── auth.js             # JWT authentication middleware
  │   ├── authMiddleware.js   # Role-based access control
  ├── models/                 # Mongoose schemas for all entities
  │   ├── Activity.js         # Activity log schema
  │   ├── Blog.js             # Blog schema
  │   ├── Component.js        # Dynamic component schema
  │   ├── ComponentType.js    # Component type schema
  │   ├── Form.js             # Form builder schema
  │   ├── FormResponse.js     # Form response schema
  │   ├── Inquiry.js          # Inquiry schema
  │   ├── Layout.js           # Layout schema
  │   ├── Lead.js             # Lead schema
  │   ├── Media.js            # Media file schema
  │   ├── MediaFolder.js      # Media folder schema
  │   ├── Newsletter.js       # Newsletter schema
  │   ├── Notification.js     # Notification schema
  │   ├── Page.js             # Page schema
  │   ├── PageInstance.js     # Page instance schema
  │   ├── Section.js          # Section schema
  │   ├── Subscriber.js       # Newsletter subscriber schema
  │   └── User.js             # User schema
  ├── package.json
  ├── routes/                 # API route definitions, grouped by feature
  │   ├── activityRoutes.js
  │   ├── auth.js
  │   ├── authRoutes.js
  │   ├── blog.js
  │   ├── blogRoutes.js
  │   ├── cms.js
  │   ├── componentRoutes.js
  │   ├── components.js
  │   ├── forms.js
  │   ├── inquiryRoutes.js
  │   ├── layouts.js
  │   ├── leadRoutes.js
  │   ├── leads.js
  │   ├── media.js
  │   ├── newsletter.js
  │   ├── newsletters.js
  │   ├── notificationRoutes.js
  │   ├── notifications.js
  │   ├── pageInstances.js
  │   ├── pageRoutes.js
  │   ├── pages.js
  │   ├── sectionRoutes.js
  ├── scripts/                # Utility scripts for seeding and maintenance
  │   ├── listComponentTypes.js
  │   ├── removeLayoutVersioning.js
  │   └── seedComponentTypes.js
  ├── server.js               # Main server file (can be used for production start)
  ├── services/               # Business logic/services (email, notifications, etc.)
  │   ├── emailService.js
  │   ├── emailTemplates/
  │   ├── inquiryService.js
  │   ├── leadService.js
  │   ├── newsletterService.js
  │   ├── notificationService.js
  ├── templates/
  │   └── meetingInvitation.js
  ├── uploads/                # Uploaded media files
  ├── utils/                  # Utility functions
  │   ├── copyright.js
  │   ├── email/
  │   ├── emailUtils.js
  │   ├── errorHandler.js
  │   ├── jwtUtils.js
  │   ├── validation.js
  │   └── validators.js
```

**Key Folder Descriptions:**
- `controllers/`: Business logic for each feature/module. Each controller handles request validation, database operations, and response formatting for its domain.
- `models/`: Mongoose schemas for all entities. Defines data structure, validation, and relationships.
- `routes/`: API route definitions, grouped by feature. Each route file maps HTTP endpoints to controller methods and applies middleware.
- `middleware/`: Express middleware for authentication, authorization, logging, error handling, and more.
- `services/`: Business logic/services (email, notifications, newsletter scheduling, etc.).
- `utils/`: Utility functions for validation, JWT, error handling, email, etc.
- `uploads/`: Uploaded media files (images, docs, etc.).
- `templates/`: Email templates for notifications and system emails.
- `scripts/`: Utility scripts for seeding, migration, and maintenance.

---

## API Endpoints & Documentation

### Authentication & User Management
**Purpose:** Secure user registration, login, password management, and role-based access.

- **Register**
  - `POST /api/auth/register`
  - **Body:** `{ "email": "user@example.com" }`
  - **Response:** `{ success: true, message: "Verification email sent" }`
  - **Notes:** Sends verification email. No auth required.

- **Set Password**
  - `POST /api/auth/set-password`
  - **Body:** `{ "token": "...", "password": "..." }`
  - **Response:** `{ success: true, message: "Password set" }`
  - **Notes:** Token from email required.

- **Login**
  - `POST /api/auth/login`
  - **Body:** `{ "email": "...", "password": "..." }`
  - **Response:** `{ success: true, token: "...", user: { ... } }`
  - **Notes:** Returns JWT. Sets HTTP-only cookie.

- **Get Current User**
  - `GET /api/auth/me`
  - **Auth:** Bearer token or cookie required.
  - **Response:** `{ success: true, data: { ...user } }`

- **Forgot/Reset Password**
  - `POST /api/auth/forgot-password` — `{ "email": "..." }`
  - `POST /api/auth/reset-password` — `{ "token": "...", "password": "..." }`

- **Authors (for blog attribution)**
  - `GET /api/auth/authors` — List all authors (admin only)
  - `POST /api/auth/authors` — Create new author (admin only)

- **User Management (Admin)**
  - `GET /api/users` — List users
  - `POST /api/users` — Create user
  - `PUT /api/users/:id` — Update user
  - `DELETE /api/users/:id` — Delete user

### Blogs
**Purpose:** Manage blog posts, including CRUD, SEO, and author attribution.

- `GET /api/blogs` — List blogs
- `POST /api/blogs` — Create blog (auth required)
- `GET /api/blogs/:id` — Get blog by ID
- `PUT /api/blogs/:id` — Update blog (auth required)
- `DELETE /api/blogs/:id` — Delete blog (admin only)

**Example Blog Object:**
```json
{
  "title": "My Blog Post",
  "content": "<p>HTML content</p>",
  "slug": "my-blog-post",
  "author": { "name": "Author Name", "role": "user" },
  "status": "draft|published",
  "featuredImage": { "url": "...", "alt": "..." },
  "seo": { "metaTitle": "...", "metaDescription": "..." }
}
```

### Pages & Content
**Purpose:** Manage pages, sections, and dynamic components for flexible site layouts.

- `GET /api/pages` — List pages
- `POST /api/pages` — Create page
- `PUT /api/pages/:id` — Update page
- `DELETE /api/pages/:id` — Delete page
- `GET /api/cms/sections` — Public sections
- `GET /api/cms/admin/sections` — All sections (admin)
- `POST /api/cms/admin/sections` — Create section
- `PUT /api/cms/admin/sections/:id` — Update section
- `DELETE /api/cms/admin/sections/:id` — Delete section
- `PUT /api/cms/admin/sections/order` — Reorder sections
- `GET /api/cms/components` — List components
- `POST /api/cms/components` — Create component
- `PUT /api/cms/components/:id` — Update component
- `DELETE /api/cms/components/:id` — Delete component

**Example Page Object:**
```json
{
  "title": "About Us",
  "slug": "about-us",
  "sections": [ ... ],
  "seo": { "metaTitle": "...", "metaDescription": "..." }
}
```

### Media
**Purpose:** Upload, manage, and serve media files (images, docs, etc.).

- `POST /api/media` — Upload file (multipart/form-data)
- `GET /api/media` — List files
- `GET /uploads/:filename` — Serve file
- `DELETE /api/media/:id` — Delete file

**Notes:**
- File uploads use Multer. Only authenticated users can upload/delete.
- Media files are stored in `/uploads`.

### Newsletter
**Purpose:** Manage newsletters, scheduling, and subscribers.

- `GET /api/newsletter` — List newsletters
- `POST /api/newsletter` — Create newsletter
- `PUT /api/newsletter/:id` — Update newsletter
- `DELETE /api/newsletter/:id` — Delete newsletter
- `POST /api/newsletter/:id/schedule` — Schedule newsletter
- `PUT /api/newsletter/:id/schedule` — Update schedule
- `POST /api/newsletter/:id/send` — Send newsletter
- `GET /api/newsletter/subscribers` — List subscribers
- `POST /api/newsletter/subscribers` — Add subscriber
- `PUT /api/newsletter/subscribers/:id` — Update subscriber
- `DELETE /api/newsletter/subscribers/:id` — Delete subscriber

**Example Newsletter Object:**
```json
{
  "subject": "Monthly Update",
  "content": "<html>...</html>",
  "schedule": { "frequency": "weekly|monthly|once", ... },
  "status": "draft|scheduled|sent"
}
```

### Leads & Inquiries
**Purpose:** Capture and manage leads and user inquiries for business growth and support.

- `GET /api/leads` — List leads
- `POST /api/leads` — Create lead
- `PUT /api/leads/:id` — Update lead
- `DELETE /api/leads/:id` — Delete lead
- `GET /api/inquiries` — List inquiries
- `POST /api/inquiries` — Create inquiry
- `PUT /api/inquiries/:id` — Update inquiry
- `DELETE /api/inquiries/:id` — Delete inquiry

**Example Lead Object:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "company": "Acme Inc.",
  "message": "Interested in your services",
  "status": "new|contacted|converted|lost"
}
```

### Forms
**Purpose:** Dynamic form builder and response collection.

- `GET /api/forms` — List forms
- `POST /api/forms` — Create form
- `GET /api/forms/:id` — Get form by ID
- `PUT /api/forms/:id` — Update form
- `DELETE /api/forms/:id` — Delete form
- `POST /api/forms/:id/submit` — Submit form response

### Notifications & Activity
**Purpose:** Real-time and persistent notifications, and activity/audit logs.

- `GET /api/notifications` — List notifications
- `POST /api/notifications` — Create notification
- `PUT /api/notifications/:id/read` — Mark as read
- `DELETE /api/notifications/:id` — Delete notification
- `GET /api/activities` — List activity logs (admin only)

### Utilities & Health
- `GET /health` — Health check (returns `{ status: 'ok' }`)
- `GET /debug` — Debug info (routes, status, etc.)

---

## Error Handling & Validation
- All endpoints return errors in the format: `{ success: false, message: "..." }`
- Validation is performed using Joi and Mongoose schema validation.
- Centralized error handler ensures consistent error responses and hides sensitive details in production.
- Rate limiting and CORS are enabled for security.

---

## Security Best Practices
- All sensitive endpoints require authentication (JWT in HTTP-only cookies or Bearer token).
- Admin-only endpoints are protected by role-based middleware.
- Passwords are hashed using bcrypt.
- Email verification and password reset use expiring tokens.
- Uploaded files are validated for type and size.

---

## Contribution Guidelines
- Follow the existing code style and structure
- Use clear, descriptive commit messages
- Add comments for complex logic
- Remove unused code and logs before submitting PRs
- Write unit/integration tests for new features
- Open issues/PRs for bugs and feature requests

---

## Author
**Tech4biz Solutions**

## License
Copyright © Tech4biz Solutions Private. All rights reserved.

--- 