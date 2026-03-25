# QCart Prisma and Database Setup

This project uses Prisma with PostgreSQL. The Prisma schema lives in `prisma/schema.prisma`, the Prisma CLI config lives in `prisma.config.ts`, and the shared app client is created in `lib/prisma.js`.

## Stack

- Prisma ORM `7.5.0`
- Prisma Client `7.5.0`
- PostgreSQL
- `@prisma/adapter-pg` for the runtime database connection

## Important Files

- `prisma/schema.prisma`: database schema
- `prisma.config.ts`: loads `.env` and `.env.local` for Prisma commands
- `lib/prisma.js`: creates a shared Prisma client for the app
- `.env`: base environment values
- `.env.local`: optional local override values

## Database Provider

The current Prisma datasource uses:

```prisma
datasource db {
  provider = "postgresql"
}
```

Set up a PostgreSQL database before running Prisma commands.

## Environment Variables

Prisma uses these connection strings:

- `DATABASE_URL`: app runtime connection
- `DIRECT_URL`: Prisma CLI connection for schema commands like `db push`

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/qcart"
DIRECT_URL="postgresql://postgres:password@localhost:5432/qcart"
```

Notes:

- `prisma.config.ts` loads `.env` first and then `.env.local`.
- Prisma CLI commands in this repo prefer `DIRECT_URL` first, then fall back to `DATABASE_URL`.
- If you use `.env.local`, its values override `.env`.
- `lib/prisma.js` will throw an error if neither `DATABASE_URL` nor `DIRECT_URL` is set.
- `lib/prisma.js` prefers `DATABASE_URL`, which is useful when you want the app to use a pooled connection.

## First-Time Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a PostgreSQL database

Create a database named `qcart` or any name you prefer, then update the connection string in `.env` or `.env.local`.

### 3. Generate the Prisma client

```bash
npm run prisma:generate
```

### 4. Push the schema to the database

```bash
npx prisma db push
```

This project currently does not include a `prisma/migrations` directory, so `db push` is the setup command that matches the current repository state.

### 5. Open Prisma Studio (optional)

```bash
npx prisma studio
```

### 6. Start the app

```bash
npm run dev
```

## Admin Login Credentials

Admin access in this project is assigned by email through `ADMIN_EMAILS`.

Current configured admin email:

```text
admin@example.com
```

Important:

- There is no hardcoded default admin password in this repository.
- The admin password is whatever password is stored for the configured admin user in the database.
- If the admin user does not exist yet, create the user first with an email that is listed in `ADMIN_EMAILS`.
- Admin login page: `/admin/login`

## Current Database Models

The schema currently creates these tables:

### `User`

Stores application users, authentication data, verification status, and role information.

Key fields:

- `id`
- `name`
- `phoneNumber`
- `email` (unique)
- `password`
- `otp`
- `otpExpiry`
- `isVerified`
- `role`
- `createdAt`
- `updatedAt`

### `Product`

Stores product records created by a user.

Key fields:

- `id`
- `userId`
- `name`
- `description`
- `price`
- `offerPrice`
- `image` (`String[]`)
- `category`
- `createdAt`
- `updatedAt`

### `Order`

Stores order data linked to a user.

Key fields:

- `id`
- `userId`
- `items` (`Json`)
- `amount`
- `address` (`Json`)
- `status`
- `paymentMethod`
- `paymentStatus`
- `createdAt`
- `updatedAt`

### `Contact`

Stores contact or inquiry submissions.

Key fields:

- `id`
- `type`
- `name`
- `email`
- `phoneNumber`
- `message`
- `status`
- `createdAt`
- `updatedAt`

## Relationships

- One `User` can have many `Order` records.
- One `User` can have many `Product` records.
- `Product.userId` references `User.id` with `onDelete: Cascade`.
- `Order.userId` references `User.id` with `onDelete: Cascade`.

## Useful Prisma Commands

```bash
npm run prisma:generate
npx prisma db push
npx prisma studio
npx prisma validate
```

## If You Want Migrations Later

If you want to move from `db push` to Prisma migrations, you can start with:

```bash
npx prisma migrate dev --name init
```

Before doing that, make sure the target database state matches the current schema and decide whether you want to keep using `db push` for development or move fully to migration-based workflow.
