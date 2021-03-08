package com.spotifiling

import cats.effect.{Blocker, ContextShift, IO, Sync}
import com.typesafe.scalalogging.StrictLogging
import fs2.io.file.{readAll, writeAll}
import fs2.{Pipe, Stream, text}

import java.nio.file.{Path, Paths, StandardOpenOption}
import scala.util.matching.UnanchoredRegex

object TextExtractor extends StrictLogging {

  def readWords(source: Path)(implicit
      c: ContextShift[IO],
      blocker: Blocker
  ): Stream[IO, String] =
    readAll[IO](source, blocker, 4096)
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
  ): PartialFunction[String, String] = {
    case pattern(url) => url
  }

  def readSourceTargetPaths(args: List[String]): IO[(Path, Path)] = {
    args match {
      case origin :: destination :: Nil =>
        IO((Paths.get(origin), Paths.get(destination)))
      case _ =>
        IO.raiseError(
          new IllegalArgumentException(
            s"Need two arguments - source and target paths - but received [${args.mkString(" ")}]"
          )
        )
    }
  }
}