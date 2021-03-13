import sbt._

object Dependencies {

  lazy val scalaTest = Seq(
    "org.scalatest" %% "scalatest" % Versions.scalaTest % Test
  )

  lazy val logging = Seq(
    "ch.qos.logback" % "logback-classic" % Versions.logback,
    "com.typesafe.scala-logging" %% "scala-logging" % Versions.typesafeLogging
  )

  lazy val pureConfig = Seq(
    "com.github.pureconfig" %% "pureconfig" % Versions.pureConfig
  )

  lazy val catsEffect = Seq(
    "org.typelevel" %% "cats-effect" % Versions.catsEffect withSources () withJavadoc ()
  )

  lazy val http4s = Seq(
    "org.http4s" %% "http4s-dsl",
    "org.http4s" %% "http4s-blaze-server",
    "org.http4s" %% "http4s-blaze-client"
  ).map(_ % Versions.http4s)

  lazy val fs2 = Seq(
    "co.fs2" % "fs2-core_2.13",
    "co.fs2" %% "fs2-io"
  ).map(_ % Versions.fs2)

  object Versions {
    val scalaTest = "3.2.2"
    val logback = "1.2.3"
    val typesafeLogging = "3.9.2"
    val pureConfig = "0.14.1"
    val catsEffect = "2.2.0"
    val fs2 = "2.5.3"
    val http4s = "0.21.18"
  }
}
