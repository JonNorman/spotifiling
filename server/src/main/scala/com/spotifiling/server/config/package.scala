package com.spotifiling.server

import cats.effect.{Blocker, ContextShift, IO, Resource}
import com.typesafe.config.ConfigFactory
import pureconfig._
import pureconfig.generic.auto._
import pureconfig.module.catseffect.syntax._

package object config {
  case class ServerConfig(host: String, port: Int)
  case class SpotifyConfig(clientId: String, clientSecret: String)

  case class Config(server: ServerConfig, spotify: SpotifyConfig)

  object Config {

    def load(configFile: String)(implicit cs: ContextShift[IO]): Resource[IO, Config] =
      load(Seq(configFile))

    def load(configFiles: Seq[String])(implicit cs: ContextShift[IO]): Resource[IO, Config] =
      Blocker[IO].flatMap { blocker =>
        Resource.liftF(
          configFiles
            .map(ConfigFactory.load)
            .map(ConfigSource.fromConfig)
            .foldLeft(ConfigSource.empty)(_.withFallback(_))
            .loadF[IO, Config](blocker)
        )
      }
  }
}
