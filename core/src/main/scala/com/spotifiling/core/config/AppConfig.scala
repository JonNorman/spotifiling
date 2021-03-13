package com.spotifiling.core.config

import pureconfig._
import pureconfig.generic.auto._

final case class AppConfig()

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
