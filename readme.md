Build docker image: docker build -t auth-service:dev -f docker/development/Dockerfile .

Run docker image: docker run --rm -it -v $(pwd):/usr/src/app -v /usr/src/app/node_modules --env-file $(pwd)/.env -p 5501:5501 -e NODE_ENV=development auth-prep:dev

Setup postgres

docker run --rm --name mernpg-container \
-e POSTGRES_USER=root -e POSTGRES_PASSWORD=root \
-v mernpgdata:/var/lib/postgresql/data \
-p 5432:5432 -d postgres:16

## Architecture guidelines

**Separate code by level of abstraction so layers are plug-and-play.**
This is the Dependency Inversion Principle / Ports & Adapters (hexagonal) pattern:
high-level policy (business logic) should not depend on low-level detail (the
database driver). Keep the layers in separate files so a low-level piece can be
swapped without rewriting the high-level code.

Example layering:

- **Controller** (`src/controllers`) — HTTP only. Knows about `req`/`res`, status
  codes, and delegates to a service. No business logic, no DB.
- **Service** (`src/services`) — business logic only. Plain, framework-agnostic
  code. It should not import `express` or `typeorm`.
- **Repository** — the data-access boundary. Define an interface _you own_ (a
  "port"), e.g. `UserRepository`, and provide an implementation (an "adapter")
  such as `TypeOrmUserRepository`. The service depends on the interface, not on
  the concrete DB library.

**Two corrections to keep in mind:**

1. An ORM does **not** give you free database portability. TypeORM abstracts SQL
   _dialects_, so Postgres → MySQL → CockroachDB is an easy swap. But
   Postgres → MongoDB is a different data model (different `MongoRepository` API,
   no joins) — not a config flip. The seam that actually makes swapping possible
   is _your own repository interface_, not the ORM itself. Note: today
   `UserService` imports `Repository` from `typeorm` directly, which couples it
   to the ORM — moving that behind a `UserRepository` interface is what makes the
   plug-and-play claim true.

2. "Write plain code in services" means **framework-agnostic domain logic** — not
   raw SQL. Raw SQL in a service would re-couple it to Postgres and defeat the
   purpose. Raw _logic_, yes; raw _queries_, no.
