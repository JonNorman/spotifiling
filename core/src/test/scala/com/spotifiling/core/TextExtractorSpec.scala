package com.spotifiling.core

import cats.effect.{Blocker, ContextShift, IO}
import fs2.Stream
import org.scalatest.flatspec.AnyFlatSpec

import java.nio.file.Paths
import scala.concurrent.ExecutionContext

class TextExtractorSpec extends AnyFlatSpec {

  private val ec: ExecutionContext = scala.concurrent.ExecutionContext.global
  private implicit val cs: ContextShift[IO] = IO.contextShift(ec)
  private implicit val blocker: Blocker = Blocker.liftExecutionContext(ec)

  "Parsing two paths as arguments" should "product two valid Paths" in {

    val origin = "/path/to/input.txt"
    val destination = "/path/to/output.txt"

    val result = TextExtractor
      .readSourceTargetPaths(List(origin, destination))
      .unsafeRunSync()

    assert(result === (Paths.get(origin), Paths.get(destination)))
  }

  "Parsing no arguments" should "throw an error" in {

    val result = TextExtractor
      .readSourceTargetPaths(List.empty)

    assertThrows[IllegalArgumentException](result.unsafeRunSync())
  }

  "Reading words from a file" should "produce a stream of words" in {

    val stream = TextExtractor.readWords(
      Paths.get(getClass.getResource("/words.txt").getPath)
    )

    assert(
      stream.compile.toList.unsafeRunSync() === List(
        "some",
        "words",
        "that",
        "each",
        "should",
        "be",
        "an",
        "element",
        "in",
        "the",
        "stream."
      )
    )
  }

  "Extracting spotify tracks" should "retain only spotify track links" in {

    val inputs = Stream.emits(
      """
        Hey how are you?! Here's a track - https://open.spotify.com/track/6LxcPUqx6noURdA5qc4BAT?si=ShX9TyBIQVGDvs8mfBiXEw - I hope you enjoy it!
        Oh and also this :https://open.spotify.com/track/190safjas90fj120!
      """.split(" ")
    )

    val result = inputs
      .collect(
        TextExtractor.extractValuesWithPattern()
      )
      .compile
      .toList

    assert(
      result === List(
        "6LxcPUqx6noURdA5qc4BAT",
        "190safjas90fj120"
      )
    )
  }
}
