package com.spotifiling.core

import cats.effect.{Blocker, ExitCode, IO, IOApp}
import fs2.Stream

import java.nio.file.{Path, Paths}

object TextExtractorApp extends IOApp {

  private implicit val blocker: Blocker =
    Blocker.liftExecutionContext(scala.concurrent.ExecutionContext.global)

  override def run(args: List[String]): IO[ExitCode] = {

    val program =
      for {
        (source, target) <- Stream.eval(readSourceTargetPaths(args))
        _ <- TextExtractor.run(source, target)
      } yield ()

    program.compile.drain.map(_ => ExitCode.Success)
  }

  def readSourceTargetPaths(args: List[String]): IO[(Path, Path)] =
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
