'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Database Setup
// Enter the three lines of code from Image 1

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// API Routes
app.get('/location', (request, response) => {
  getLocation(request.query.data)
    .then(location => {
      // console.log('27', location);
      response.send(location)
    })
    .catch(error => handleError(error, response));
})

// Do not comment in until you have locations in the DB
app.get('/weather', getWeather);

// Do not comment in until weather is working
app.get('/meetups', getMeetups);

app.get('/yelp', getYelps);

app.get('/trails', getTrails);

app.get(`/movies`, getMovies);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// *********************
// MODELS
// *********************

function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.formatted_address;
  this.latitude = res.geometry.location.lat;
  this.longitude = res.geometry.location.lng;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Meetup(meetup) {
  console.log(`meetup`,meetup);
  this.link = meetup.link;
  this.name = meetup.group.name;
  this.creation_date = new Date(meetup.group.created).toString().slice(0, 15);
  this.host = meetup.group.who;
  // this.created_at = Date.now();
  // this.tableName = 'meetups';
}

function Yelp(yelp) {
  console.log(`yelp`,yelp);
  this.url = yelp.url;
  this.name = yelp.name;
  this.rating = yelp.rating;
  this.price = yelp.price;
  this.image_url = yelp.image_url;
}

function Trail(trail) {
  console.log(`trail`,trail);
  this.trail_url = trail.url;
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.condition_date = trail.conditionDate.slice(0, 10);
  this.condition_time = trail.conditionDate.slice(-8);
  this.conditions = trail.conditionStatus;
  this.stars = trail.stars.toString();
  this.star_votes = trail.starVotes.toString();
  this.summary = trail.summary;
}

function Movie(movie) {
  console.log(`movie`,movie);
  this.title = movie.title;
  this.released_on = movie.release_date;
  this.total_votes = movie.vote_count;
  this.average_votes = movie.vote_average.toString();
  this.popularity = movie.popularity;
  this.summary = movie.overview;
  this.image_url = `https://image.tmdb.org/t/p/w92/${movie.poster_path}`;
}

// *********************
// HELPER FUNCTIONS
// *********************

function handleError(err, res) {
  // console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

function getLocation(query) {
  // CREATE the query string to check for the existence of the location
  const SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  const values = [query];

  // Make the query of the database
  return client.query(SQL, values)
    .then(result => {
      // Check to see if the location was found and return the results
      if (result.rowCount > 0) {
        // console.log('From SQL');
        return result.rows[0];

        // Otherwise get the location information from the Google API
      } else {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
        // console.log(url);
        return superagent.get(url)
          .then(data => {
            // console.log('FROM API line 90');
            // Throw an error if there is a problem with the API request
            if (!data.body.results.length) { throw 'no Data' }

            // Otherwise create an instance of Location
            else {
              let location = new Location(query, data.body.results[0]);
              // console.log('98', location);

              // Create a query string to INSERT a new record with the location data
              let newSQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id;`;
              // console.log('102', newSQL)
              let newValues = Object.values(location);
              // console.log('104', newValues)

              // Add the record to the database
              return client.query(newSQL, newValues)
                .then(result => {
                  // console.log('108', result.rows);
                  // Attach the id of the newly created record to the instance of location.
                  // This will be used to connect the location to the other databases.
                  // console.log('114', result.rows[0].id)
                  location.id = result.rows[0].id;
                  return location;
                })
                .catch(console.error);
            }
          })
          .catch(error => console.log('Error in SQL Call'));
      }
    });
}

function getWeather(request, response) {
  // create the query string tocheck for the existence of the location
  const SQL = 'SELECT * FROM weathers WHERE location_id=$1';
  const values = [request.query.data.id];

  // Make the query of the database
  return client.query(SQL, values)
    .then(result => {
      // check to see if the location was found and return the results
      if (result.rowCount > 0) {
        // console.log('From SQL', result.rows);
        response.send(result.rows);
        // Otherwise get the location information from Dark Sky
      } else {
        const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

        superagent.get(url)
          .then(result => {
            const weatherSummaries = result.body.daily.data.map(day => {
              const summary = new Weather(day);
              return summary;
            });
            let newSQL = `INSERT INTO weathers(forecast, time, location_id) VALUES($1, $2, $3);`;
            // console.log('153', weatherSummaries);
            weatherSummaries.forEach(summary => {
              let newValues = Object.values(summary);
              newValues.push(request.query.data.id);
              // Add the recod to th database
              return client.query(newSQL, newValues)
                .catch(console.error);
            })
            response.send(weatherSummaries);
          })
          .catch(error => handleError(error, response));
      }
    })
}


function getMeetups(request, response) {
  const SQL = `SELECT * FROM meetups WHERE location_id=$1;`;
  const values = [request.query.data.id];
  // console.log('178', request.query);
  return client.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        // console.log('From SQL');
        response.send(result.rows);
      } else {

        const url = `https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&lon=${request.query.data.longitude}&page=20&lat=${request.query.data.latitude}&key=${process.env.MEETUP_API_KEY}`

        superagent.get(url)
          .then(result => {
            const meetups = result.body.events.map(meetup => {
              const event = new Meetup(meetup);
              return event;
            });

            //SQL TIME
            let newSQL = `INSERT INTO meetups(link, name, creation_date, host, location_id) VALUES($1, $2, $3, $4, $5);`;
            meetups.forEach(meetup => {
              let newValues = Object.values(meetup);
              newValues.push(request.query.data.id);
              // add the record
              return client.query(newSQL, newValues)
                .catch(console.Error);
            })

            response.send(meetups);
          })
          .catch(error => handleError(error, response));
      }
    })

}

function getYelps(request, response) {
  const SQL = `SELECT * FROM yelps WHERE location_id=$1;`;
  const values = [request.query.data.id];
  return client.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        // console.log('From SQL');
        response.send(result.rows);
      } else {

        const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;

        superagent.get(url)
          .set(`Authorization`, `Bearer ${process.env.YELP_API_KEY}`)
          .then(result => {
            const yelps = result.body.businesses.map(yelp => {
              const business = new Yelp(yelp);
              return business;
            });

            //SQL TIME
            let newSQL = `INSERT INTO yelps(url, name, rating, price, image_url, location_id) VALUES($1, $2, $3, $4, $5, $6);`;
            yelps.forEach(yelp => {
              let newValues = Object.values(yelp);
              newValues.push(request.query.data.id);
              // add the record
              return client.query(newSQL, newValues)
                .catch(console.Error);
            })
            // console.log('yelps:', yelps);

            response.send(yelps);
          })
          .catch(error => handleError(error, response));
      }
    })

}

function getTrails(request, response) {
  const SQL = `SELECT * FROM trails WHERE location_id=$1;`;
  const values = [request.query.data.id];
  return client.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        // console.log('From SQL');
        response.send(result.rows);
      } else {

        const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&maxDistance=10&key=${process.env.TRAILS_API_KEY}`;

        superagent.get(url)
          .then(result => {
            const trails = result.body.trails.map(trailResult => {
              const trail = new Trail(trailResult);
              return trail;
            });

            //SQL TIME
            let newSQL = `INSERT INTO trails(trail_url, name, location, length, condition_date, condition_time, conditions, stars, star_votes, summary, location_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`;
            trails.forEach(trail => {
              let newValues = Object.values(trail);
              newValues.push(request.query.data.id);
              // add the record
              return client.query(newSQL, newValues)
                .catch(console.Error);
            })
            // console.log('trails:', trails);

            response.send(trails);
          })
          .catch(error => handleError(error, response));
      }
    })

}

function getMovies(request, response) {
  const SQL = `SELECT * FROM movies WHERE location_id=$1;`;
  const values = [request.query.data.id];
  return client.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        // console.log('From SQL');
        response.send(result.rows);
      } else {

        const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_DB_API_KEY}&language=en-US&query=a&page=1&include_adult=false`
        // console.log(url);
        superagent.get(url)
          .then(result => {
            const movies = result.body.results.map(movieResult => {
              const movie = new Movie(movieResult);
              return movie;
            });

            //SQL TIME
            let newSQL = `INSERT INTO movies(title, released_on, total_votes, average_votes, popularity, summary, image_url, location_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8);`;
            movies.forEach(trail => {
              let newValues = Object.values(trail);
              newValues.push(request.query.data.id);
              // add the record
              return client.query(newSQL, newValues)
                .catch(console.Error);
            })
            // console.log('movies:', movies);

            response.send(movies);
          })
          .catch(error => handleError(error, response));
      }
    })

}

