package com.spotifiling

import cats.effect.{Blocker, ExitCode, IO, IOApp}
import fs2.Stream

object Main extends IOApp {

  import TextExtractor._

  private implicit val blocker: Blocker =
    Blocker.liftExecutionContext(scala.concurrent.ExecutionContext.global)

  override def run(args: List[String]): IO[ExitCode] = {

    val program =
      for {
        (source, target) <-
          Stream.eval(TextExtractor.readSourceTargetPaths(args))
        _ <- readWords(source)
          .collect(extractValuesWithPattern())
          .through(write(target))
      } yield ()

    program.compile.drain.map(_ => ExitCode.Success)
  }
}
