package com.spotifiling.server.service

import cats.effect.IO
import org.http4s.HttpRoutes
import org.http4s.dsl.Http4sDsl

class SpotifilingService extends Http4sDsl[IO] {

  val routes = HttpRoutes.of[IO] { case GET -> Root =>
    Ok("What would you like to do?")
  }
}
