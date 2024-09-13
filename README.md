# esbern.org Server
The server-side endpoints and logic for esbern.org.

## Prerequisites
* Node.js >= 22
* NPM
* MySQL compatible database (Tested on MariaDB 10)

## Installation
#### Project
```
# Clone the repository
git clone https://github.com/commgdog/esbern-org-server.git

# Navigate to the project folder
cd esbern-org-server

# Install dependencies
npm i
```
#### Database
```
# Create the database
mysql -h <host> -u <user> -p -e "CREATE DATABASE <database>"

# Create the tables
mysql -h <host> -u <user> -p <database> < ./src/sql/create-tables.sql
```
#### Hydrate
```
npm run reset-administrator
```

## Environmental Variables
The following environmental variables are available:
* `EXPRESS_LISTEN_HOST` (not required, default: localhost)
* `EXPRESS_LISTEN_PORT` (not required, default: 3000)
* `DB_HOST` (required)
* `DB_USER` (required)
* `DB_PASS` (required)
* `DB_NAME` (required)

For development, you can make a file called `.env` in the root directory of the project.
Inside you can define environmental variables in the format `VARIABLE=VALUE`.

For example: `EXPRESS_LISTEN_PORT=3001`

If you are running tests, you must also create a file called `.env.test` in the root
directory of the project. This file should have the same format as the aforementioned
`.env` file, except that it is only loaded when tests are run via `npm run test`.

You must omit the `DB_NAME` environmental variable in `.env.test` since the test suites
will generate their own database for each suite.

Note: `.env` files should **NOT** be used in production.

## File Structure
```
+-- src - Source directory
|   +-- @types - Typescript definition files
|   +-- apis - Models, controllers, and routers
|   +-- middlewares - ExpressJS middlewares
|   +-- services - Core services
|   +-- sql - SQL scripts
+-- test - Tests directory
    +-- integration - Integration tests
    +-- unit - Unit tests
```

## Database
For the project to run, you must create a database and create the required tables. This project
includes the script `src/sql/create-tables.sql` to facilitate table creation.

## Hydrating the Database
When the database and tables are created, they contain no data. This project includes a script
for hydrating the database with an `Administrator` role and optional user. When developing, you
can run `npm run reset-administrator` to execute the script. In production, you must find and
execute the script in `cli/`.

Note: The `reset-administrator` script may also be used to reset the `Administrator` role if permissions
are accidentally stripped or an account is removed from the `Administrator` role on accident.

## Running the Development Server
You can run `npm run dev` to start the development server. This project utilizes the `tsx`
package for watching for file changes and automatically restarting the server when developing.

## Linting
This project utilizes `eslint` for linting. You can perform linting by running `npm run lint`.
Alternatively, if you are using WebStorm you can configure the IDE to perform the linting.

To configure ESLint functionality in WebStorm, navigate to:

`Settings -> Languages & Frameworks -> JavaScript -> Code Quality Tools -> ESLint`

Set the configuration to `Manual ESLint configuration` and set the `ESLint package` to the
`eslint` package within the project's `node_modules`. 

Set the configuration file to `eslint.config.mjs` which can be found in the root directory
of the project.

Additionally, you can set `Run eslint --fix on save` if you would like it to lint on save.

## Formatting
This project utilizes `prettier` for code formatting. You can perform code formatting by
running `npm run format`. Alternatively, if you are using WebStorm you can configure the
IDE to perform the formatting.

To configure Prettier functionality in WebStorm, navigate to:

`Settings -> Languages & Frameworks -> JavaScript -> Prettier`

Set the configuration to `Manual Prettier configuration` and set the `Prettier package` to
the `prettier` package within the project's `node_modules`.

Additionally, you can set `Run on save` if you would like it to format on save.

## Testing
This project utilizes `vitest` for testing. You can perform all tests by running
`npm run test`. Tests are placed in the `tests/` directory. Integration testing should go in
a subdirectory called `intigration`, unit tests should go in a subdirectory called `unit`, etc.

VITest is configured via the two configuration files included in `vitest.config.ts` and
`vitest.setup.ts`, the latter which handles global mocking. Test-level mocking functionality
is included in the file `tests/mock.ts`.

Integration testing is performed via the package `supertest` to simulate endpoint requests.

## Building
You can build this project by running `npm run build`. The build will be placed in a directory
called `build/` within the root directory of the project.

The build includes a stripped `package.json` file for production.

The build procedure can be reviewed in `build.ts` within the root directory of the project.
