package com.spotifiling

import cats.effect.{Blocker, ExitCode, IO, IOApp}
import com.spotifiling.config.AppConfig
import fs2.Stream

object App extends IOApp {

  import TextExtractor._

  private implicit val blocker: Blocker =
    Blocker.liftExecutionContext(scala.concurrent.ExecutionContext.global)

  override def run(args: List[String]): IO[ExitCode] = {

    val program =
      for {
        config <- Stream.eval(IO(AppConfig.get))
        (source, target) <- Stream.eval(TextExtractor.readSourceTargetPaths(args))
        _ <- readWords(source)
          .collect(extractValuesWithPattern())
          .through(write(target))
      } yield ()

    program.compile.drain.map(_ => ExitCode.Success)
  }
}
