import cats.effect.{Blocker, ContextShift, ExitCode, IO, IOApp, Sync}
import com.typesafe.scalalogging.StrictLogging
import fs2.io.file.{readAll, writeAll}
import fs2.{Pipe, Stream, text}

import java.nio.file.{Path, Paths, StandardOpenOption}
import scala.util.matching.UnanchoredRegex

object Main extends IOApp {

  import TextExtractor._

  private implicit val blocker: Blocker =
    Blocker.liftExecutionContext(scala.concurrent.ExecutionContext.global)

  override def run(args: List[String]): IO[ExitCode] = {

    val program = {
      for {
        (source, target) <- readSourceTargetPaths(args)
        _ <- readWords(source)
          .collect(extractValuesWithPattern(spotifyTrackPattern))
          .through(write(target))
      } yield ()
    }

    program.compile.drain.map(_ => ExitCode.Success)
  }

  def readSourceTargetPaths(args: List[String]): Stream[IO, (Path, Path)] = {
    args match {
      case origin :: destination :: Nil =>
        Stream.eval(IO((Paths.get(origin), Paths.get(destination))))
      case _ =>
        Stream.eval(
          IO.raiseError(
            new IllegalArgumentException(
              s"Need two arguments - source and target paths - but received ${args.mkString(" ")}"
            )
          )
        )
    }
  }

  val spotifyTrackPattern: UnanchoredRegex =
    ".*(https://open.spotify.com/track/[a-zA-Z0-9]*).*".r.unanchored
}

object TextExtractor extends StrictLogging {

  def readWords(source: Path)(implicit
      c: ContextShift[IO],
      blocker: Blocker
  ): Stream[IO, String] =
    readAll[IO](source, blocker, 4096)
      .through(text.utf8Decode)
      .through(text.lines)
      .flatMap(line => Stream.apply(line.split("""\s+"""): _*))

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

  def extractValuesWithPattern(
      pattern: UnanchoredRegex
  ): PartialFunction[String, String] = {
    case pattern(url) => url
  }
}
