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

## Development Scripts

**Not included in builds for production**

* `npm run dev` - Spin up a development server.
* `npm run lint` - Lint and fix the entire project.
* `npm run test` - Run all tests in the project.
* `npm run build` - Build the project for production.
* `npm run reset-administrator` - Reset the "Administrator" role and create initial users.

## Dependencies
* [bcryptjs](https://www.npmjs.com/package/bcryptjs) - Cryptographic hashing.
* [cors](https://www.npmjs.com/package/cors) - Cross origin resource sharing.
* [dayjs](https://www.npmjs.com/package/dayjs) - Date and time manipulation and formatting.
* [express](https://www.npmjs.com/package/express) - Web framework.
* [joi](https://www.npmjs.com/package/joi) - Input validation.
* [mysql2](https://www.npmjs.com/package/mysql2) - Database client.
* [prompt-sync](https://www.npmjs.com/package/prompt-sync) - Input prompt for CLI scripts.
* [uuidv7](https://www.npmjs.com/package/uuidv7) - Universal unique identifier generation.
* [winston](https://www.npmjs.com/package/winston) - Logging service.

## Development Dependencies
* [@eslint/js](https://www.npmjs.com/package/@eslint/js) - Base recommended linting config.
* [@stylistic/eslint-plugin](https://www.npmjs.com/package/@stylistic/eslint-plugin) - Formatting rules for linting.
* [@types/bcryptjs](https://www.npmjs.com/package/@types/bcryptjs) - Type definitions for `bcryptjs`.
* [@types/cors](https://www.npmjs.com/package/@types/cors) - Type definitions for `cors`.
* [@types/express](https://www.npmjs.com/package/@types/bcryptjs) - Type definitions for `express`.
* [@types/node](https://www.npmjs.com/package/@types/node) - Type definitions for `node`.
* [@types/prompt-sync](https://www.npmjs.com/package/@types/prompt-sync) - Type definitions for `prompt-sync`.
* [@types/supertest](https://www.npmjs.com/package/@types/supertest) - Type definitions for `supertest`.
* [dotenv](https://www.npmjs.com/package/dotenv) - Environmental config for testing.
* [eslint](https://www.npmjs.com/package/eslint) - Linting and formatting.
* [supertest](https://www.npmjs.com/package/supertest) - Framework for testing HTTP requests.
* [tsx](https://www.npmjs.com/package/tsx) - Typescript execution.
* [typescript](https://www.npmjs.com/package/typescript) - Typescript core.
* [typescript-eslint](https://www.npmjs.com/package/typescript-eslint) - Typescript tooling for linting.
* [vitest](https://www.npmjs.com/package/vitest) - Testing framework.




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

This project utilizes `stylistic` for along with `eslint` for code formatting. Code formatting
will be performed upon linting with `es run lint`.

To configure ESLint functionality in WebStorm, navigate to:

`Settings -> Languages & Frameworks -> JavaScript -> Code Quality Tools -> ESLint`

Set the configuration to `Manual ESLint configuration` and set the `ESLint package` to the
`eslint` package within the project's `node_modules`. 

Set the configuration file to `eslint.config.mjs` which can be found in the root directory
of the project.

Additionally, you can set `Run eslint --fix on save` if you would like it to lint on save.

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
