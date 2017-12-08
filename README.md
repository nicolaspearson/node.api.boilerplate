# README

This is a Node JS Boilerplate API, built using Koa, Typescript, MySQL, and
Socket.IO. It comes with clustering support out of the box that works with
Socket.IO connections.

### Running the project

1. Run `npm install / yarn install`
2. Run `docker-compose up`, this will run the container for MySQL DB.
3. Run `docker ps` to find the name of the docker container.
4. Run `docker exec -i -t <docker-container-name> /bin/bash` to open a bash in
	the container, e.g. `docker exec -i -t nab /bin/bash`
5. Run `npm run build` to compile the typescript into the dist folder.
6. Run `npm start` to run the application.
7. Run `npm run serve:prod` to run the server in a production environment.
8. Run `npm run test:unit` to execute the unit tests.
9. To customize, update the configuration parameters in `./config/default.yml`
	or `./config/production.yml` and the docker compose .yml files

### Auth and Credentials

The server automatically creates the following test credentials if there are no
users in the database:

* Username: `Tester`
* Password: `hello123`

You can use these credentials to execute the
`http://localhost:3000/api/v1/users/login` POST API call and retrieve a JWT
token.

### Generating new Controllers, Models, Repositories, and Services

There is local a generate script available via `npm run`, that will assist in
generating new Controllers, Models, Repositories, and Services. For example, if
you have a new table called 'Fish' in your database, you can use this command to
help generate all of the boilerplate scaffolding required when using the
repository pattern:

* Run `npm run generate`
* Select the component that you would like to generate, e.g. `All` will generate
	a Controller, Model, Repository, and Service
* Provide a name for the component, e.g. `Fish`, if you need to generate a
	multi-word component please use LetterCasing, e.g. `GoldFish`.

The templates can be customized as required in `./src/templates/`

### Clustering

A single instance of Node.js runs in a single thread. To take advantage of
multi-core systems, the user will sometimes want to launch a cluster of Node.js
processes to handle the load.

In cluster environment socket.io requires you to use sticky sessions, to ensure
that a given client hits the same process every time, otherwise its handshake
mechanism won't work properly. I adapted the
[Sticky Cluster](https://github.com/uqee/sticky-cluster) module to support
Typescript.

## Technologies used:

### For the application

* [Class Validator](https://www.npmjs.com/package/class-validator)
* [Config](https://www.npmjs.com/package/config)
* [Docker](https://www.docker.com/)
* [Event Dispatch](https://www.npmjs.com/package/event-dispatch)
* [JSON Web Token](https://www.npmjs.com/package/jsonwebtoken)
* [Koa](https://www.npmjs.com/package/koa)
* [MySQL](https://www.npmjs.com/package/mysql)
* [Routing Controllers](https://www.npmjs.com/package/routing-controllers)
* [Socket.IO](https://www.npmjs.com/package/socket.io)
* [Type DI](https://www.npmjs.com/package/typedi)
* [Typescript](https://www.typescriptlang.org/)
* [Type ORM](https://www.npmjs.com/package/typeorm)
* [Swagger JS Doc](https://www.npmjs.com/package/swagger-jsdoc)
* [Winston](https://www.npmjs.com/package/winston)

### For testing

* [Chai](https://www.npmjs.com/package/chai)
* [Mocha](https://www.npmjs.com/package/mocha)
* [Sinon](https://www.npmjs.com/package/sinon)
* [Supertest](https://www.npmjs.com/package/supertest)
* [TS-Mockito](https://www.npmjs.com/package/ts-mockito)

### Contribution guidelines

* Code reviews are done via pull requests
* Never commit directly to develop, staging, or master
