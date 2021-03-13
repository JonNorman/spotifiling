package com.spotifiling.server

import cats.effect.IO
import com.spotifiling.server.service.SpotifilingService
import org.http4s.dsl.io.GET
import org.http4s.{Request, Response, Status}
import org.http4s.implicits._
import org.scalatest.flatspec.AnyFlatSpec

class SpotifilingServiceSpec extends AnyFlatSpec {

  private val service = new SpotifilingService().routes

  "SpotifilingService" should "return a welcoming response" in {

    val response = serve(Request[IO](GET, uri"/"))
    assert(response.status === Status.Ok)
    assert(response.as[String].unsafeRunSync() === "What would you like to do?")

  }

  private def serve(request: Request[IO]): Response[IO] =
    service.orNotFound(request).unsafeRunSync()

}
