import Dependencies._
import sbt.Keys.scalacOptions

ThisBuild / scalaVersion := "2.13.4"
ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / organization := "com.spotifiling"
ThisBuild / organizationName := "spotifiling"

lazy val root = (project in file("."))
  .settings(
    name := "spotifiling",
    libraryDependencies ++= catsEffect ++ fs2 ++ logging ++ scalaTest,
    scalacOptions ++= Seq(
      "-feature",
      "-deprecation",
      "-unchecked",
      "-language:postfixOps",
      "-language:higherKinds"
    )
  )

// See https://www.scala-sbt.org/1.x/docs/Using-Sonatype.html for instructions on how to publish to Sonatype.
