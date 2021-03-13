package com.spotifiling.core

import cats.effect.{Blocker, ContextShift, IO, Sync}
import com.typesafe.scalalogging.StrictLogging
import fs2.io.file.{readAll, writeAll}
import fs2.{Pipe, Stream, text}

import java.nio.file.{Path, Paths, StandardOpenOption}
import scala.util.matching.UnanchoredRegex

object TextExtractor extends StrictLogging {

  def run[F[_]](source: Path, target: Path)(implicit
      cs: ContextShift[F],
      blocker: Blocker,
      sync: Sync[F]
  ): Stream[F, Unit] =
    for {
      _ <- readWords(source)
        .collect(extractValuesWithPattern())
        .through(write(target))
    } yield ()

  def readWords[F[_]](source: Path)(implicit
      c: ContextShift[F],
      sync: Sync[F],
      blocker: Blocker
  ): Stream[F, String] =
    readAll[F](source, blocker, 4096)
      .through(text.utf8Decode)
      .through(text.lines)
      .flatMap(line => Stream.emits(line.split("""\s+""")))

  def write[F[_]](target: Path)(implicit
      c: ContextShift[F],
      blocker: Blocker,
      sync: Sync[F]
  ): Pipe[F, String, Unit] =
    _.intersperse(System.lineSeparator)
      .through(text.utf8Encode)
      .through(
        writeAll[F](
          target,
          blocker,
          List(StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)
        )
      )

  val spotifyTrackIdPattern: UnanchoredRegex =
    ".*https://open.spotify.com/track/([a-zA-Z0-9]*).*".r.unanchored

  def extractValuesWithPattern(
      pattern: UnanchoredRegex = spotifyTrackIdPattern
  ): PartialFunction[String, String] = { case pattern(url) =>
    url
  }
}
