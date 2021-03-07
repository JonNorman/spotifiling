import cats.effect.concurrent.Semaphore
import cats.effect.{Concurrent, ExitCode, IO, IOApp, Resource}
import com.typesafe.scalalogging.StrictLogging

import java.io._
import scala.io.{BufferedSource, Source}

object Main extends IOApp {

  override def run(args: List[String]): IO[ExitCode] =
    for {
      _ <-
        if (args.length < 2)
          IO.raiseError(
            new IllegalArgumentException("Need origin and destination files")
          )
        else IO.unit
      origin = new File(args.head)
      destination = new File(args(1))
      count <-
        WhatsAppSpotify.copySpotifyTracks(origin, destination, isSpotifyTrack)
      _ <- IO(println(s"$count spotify tracks found..."))
    } yield ExitCode.Success

  def isSpotifyTrack(message: String): Boolean =
    message.contains("https://open.spotify.com/track/")
}

object WhatsAppSpotify extends StrictLogging {

  type IsSpotifyTrack = String => Boolean

  def copySpotifyTracks(
      origin: File,
      destination: File,
      isSpotifyTrack: IsSpotifyTrack
  )(implicit concurrent: Concurrent[IO]): IO[Long] =
    for {
      guard <- Semaphore[IO](1)
      count <- sourceWriter(origin, destination, guard).use {
        case (in, out) =>
          guard.withPermit(transfer(in, out, isSpotifyTrack))
      }
    } yield count

  def transfer(
      in: BufferedSource,
      out: BufferedWriter,
      isSpotifyTrack: IsSpotifyTrack
  ): IO[Long] = {
    for {
      lines <- IO(in.getLines())
      spotifyTracks = lines.filter(isSpotifyTrack)
      writes <- IO(spotifyTracks.map { spotifyTrack =>
        out.write(spotifyTrack)
        out.newLine()
      })
    } yield writes.length
  }

  def bufferedSource(
      f: File,
      guard: Semaphore[IO]
  ): Resource[IO, BufferedSource] =
    Resource.make {
      IO(Source.fromFile(f))
    } { bufferedSource =>
      guard.withPermit(
        IO(bufferedSource.close()).handleErrorWith(err =>
          IO(
            logger.error(
              s"Closing bufferedSource for ${f.getAbsoluteFile} failed",
              err
            )
          )
        )
      )
    }

  def bufferedWriter(
      f: File,
      guard: Semaphore[IO]
  ): Resource[IO, BufferedWriter] =
    Resource.make {
      IO(new BufferedWriter(new FileWriter(f)))
    } { bufferedWriter =>
      guard.withPermit(
        IO(bufferedWriter.close()).handleErrorWith(err =>
          IO(
            logger.error(
              s"Closing buffered writer for ${f.getAbsoluteFile} failed",
              err
            )
          )
        )
      )
    }

  def sourceWriter(
      in: File,
      out: File,
      guard: Semaphore[IO]
  ): Resource[IO, (BufferedSource, BufferedWriter)] =
    for {
      bufferedSource <- bufferedSource(in, guard)
      bufferedWriter <- bufferedWriter(out, guard)
    } yield (bufferedSource, bufferedWriter)

}
