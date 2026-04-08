Basically, there are no good all-in-one CDNs, so I built this.

## Setup

1. Install dependencies

```sh
npm install
```

2. Configure `.env`

```env
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000

DATABASE_URL=postgres://root:mysecretpassword@localhost:5432/local
ORIGIN=http://localhost:5173

OG_ADMIN_NAME=Your Name
OG_ADMIN_EMAIL=you@example.com
OG_ADMIN_PASSWORD=replace-with-a-strong-password
```

3. Start Postgres

```sh
npm run db:start
```

4. Push schema

```sh
npm run db:push
```

5. Start app

```sh
npm run dev
```

## OG Admin Bootstrap

If `OG_ADMIN_NAME`, `OG_ADMIN_EMAIL`, and `OG_ADMIN_PASSWORD` are set, the app bootstraps an admin user automatically:

- Creates the user if missing
- Creates credential account if missing
- Adds the user to `admin_list` if missing

## Useful Commands

```sh
npm run dev
npm run build
npm run preview
npm run db:start
npm run db:push
npm run db:generate
npm run db:migrate
npm run db:studio
npm run auth:schema
```