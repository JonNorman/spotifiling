package com.spotifiling.server

import cats.effect.{ConcurrentEffect, ContextShift, ExitCode, IO, Timer}
import com.spotifiling.server.config.Config
import com.spotifiling.server.service.SpotifilingService
import org.http4s.implicits._
import org.http4s.server.blaze.BlazeServerBuilder

import scala.concurrent.ExecutionContext.global

object HttpServer {

  def create(
      configFiles: Seq[String] = Seq("application.conf", "secrets.conf")
  )(implicit contextShift: ContextShift[IO], concurrentEffect: ConcurrentEffect[IO], timer: Timer[IO]): IO[ExitCode] =
    Config.load(configFiles).use(create)

  private def create(
      config: Config
  )(implicit concurrentEffect: ConcurrentEffect[IO], timer: Timer[IO]): IO[ExitCode] =
    for {
      exitCode <- BlazeServerBuilder[IO](global)
        .bindHttp(config.server.port, config.server.host)
        .withHttpApp(new SpotifilingService().routes.orNotFound)
        .serve
        .compile
        .lastOrError
    } yield exitCode
}
