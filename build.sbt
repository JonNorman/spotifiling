import Dependencies._
import sbt.Keys.scalacOptions

ThisBuild / scalaVersion := "2.13.4"
ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / organization := "com.spotifiling"
ThisBuild / organizationName := "spotifiling"

lazy val server = project
  .settings(
    name := "spotifiling-server",
    commonSettings,
    libraryDependencies ++= catsEffect ++ fs2 ++ logging ++ pureConfig ++ http4s ++ scalaTest
  )
  .dependsOn(
    core
  )

lazy val core = project
  .settings(
    name := "spotifiling-core",
    commonSettings,
    libraryDependencies ++= catsEffect ++ fs2 ++ logging ++ pureConfig ++ scalaTest
  )

lazy val commonSettings = Seq(
  scalacOptions ++= compilerOptions
)

lazy val compilerOptions = Seq(
  "-feature",
  "-deprecation",
  "-unchecked",
  "-language:postfixOps",
  "-language:higherKinds"
)
