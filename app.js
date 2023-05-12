const express = require("express");
const path = require("path");

const app = express();
module.exports = app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "moviesData.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(5000, () => {
      console.log("Server Running at http://localhost:5000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    movieName: dbObject.movie_name,
    directorId: dbObject.director_id,
    leadActor: dbObject.lead_actor,
    directorName: dbObject.director_name,
  };
};

//get movies

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT
      movie_id as movieId,movie_name as movieName
    FROM
      movie
    ORDER BY
      movie_id;`;
  const moviesArray = await database.all(getMoviesQuery);
  response.send(moviesArray);
});

//post a movie
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  //console.log(request.body);
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    insert into movie (director_id,movie_name,lead_actor)
    values ('${directorId}','${movieName}','${leadActor}'
    )`;
  await database.run(addMovieQuery);

  response.send("Movie Successfully Added");
});

//get a movie
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    select * from movie where movie_id=${movieId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//update a movie
app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
   UPDATE movie SET
   director_id=${directorId},
   movie_name='${movieName}',
   lead_actor='${leadActor}'
   WHERE
   movie_id=${movieId};`;

  await database.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//DElete a movie

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie WHERE movie_id=${movieId};`;
  await database.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//get directors

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      director_id as directorId,director_name as directorName
    FROM
      director
    ORDER BY
      director_id;`;
  const directorsArray = await database.all(getDirectorsQuery);
  response.send(directorsArray);
});

//a list of all movie names directed by a specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieQuery = `
    select movie_name as movieName from movie where director_id=${directorId}`;
  const movie = await database.all(getMovieQuery);
  response.send(movie);
});

module.exports = app;
