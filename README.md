# Spotifiling
A service designed to make organising your spotify library a breeze, written using [http4s](http://http4s.org/) and
[fs2](https://github.com/functional-streams-for-scala/fs2).

## Project structure
This project is split into two:
- `spotifiling-server` - responsible for handling requests and responses.
- `spotifiling-core` - all logic for all spotify-specific concerns.

## Getting started
To run the server run
```shell
sbt 'project server; run'
```

## Tests
```shell
sbt test
```

## Configuration
[pureconfig](https://github.com/pureconfig/pureconfig) is used to read the configuration file(s) `application.conf` and
`secrets.conf`.


## Running
You can run the microservice with `sbt run`. By default it listens to port number 8080, you can change this in the
`application.conf`.
