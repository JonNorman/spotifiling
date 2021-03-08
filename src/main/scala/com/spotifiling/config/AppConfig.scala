package com.spotifiling.config

import pureconfig._
import pureconfig.generic.auto._

final case class Spotify(
    clientId: String,
    playlistId: String
)

final case class AppConfig(spotify: Spotify)

object AppConfig {

  lazy val get = {
    val application = ConfigSource.default
    val secrets = ConfigSource
      .url(getClass.getResource("/application.secrets"))
    application
      .withFallback(secrets)
      .loadOrThrow[AppConfig]
  }

}
