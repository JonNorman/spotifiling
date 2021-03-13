package com.spotifiling.core

import cats.effect.{Blocker, ContextShift, IO}
import fs2.Stream
import org.scalatest.flatspec.AnyFlatSpec

import java.nio.file.Paths
import scala.concurrent.ExecutionContext

class TextExtractorAppSpec extends AnyFlatSpec {

  private val ec: ExecutionContext = scala.concurrent.ExecutionContext.global
  private implicit val cs: ContextShift[IO] = IO.contextShift(ec)
  private implicit val blocker: Blocker = Blocker.liftExecutionContext(ec)

  "Parsing two paths as arguments" should "product two valid Paths" in {

    val origin = "/path/to/input.txt"
    val destination = "/path/to/output.txt"

    val result = TextExtractorApp
      .readSourceTargetPaths(List(origin, destination))
      .unsafeRunSync()

    assert(result === (Paths.get(origin), Paths.get(destination)))
  }

  "Parsing no arguments" should "throw an error" in {

    val result = TextExtractorApp
      .readSourceTargetPaths(List.empty)

    assertThrows[IllegalArgumentException](result.unsafeRunSync())
  }
}
