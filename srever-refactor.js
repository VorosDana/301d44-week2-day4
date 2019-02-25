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
app.get('/location', getLocation)

// Do not comment in until you have locations in the DB
app.get('/weather', getWeather);

// Do not comment in until weather is working
app.get('/meetups', getMeetups);

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
  this.link = meetup.link;
  this.name = meetup.group.name;
  this.creation_date = new Date(meetup.group.created).toString().slice(0, 15);
  this.host = meetup.group.who;
  // this.created_at = Date.now();
  // this.tableName = 'meetups';
}

function handleError(err, res) {
  // console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// *******************
// Route calls
// *******************

function getLocation(req, res) {
  const sqlSearch = checkCache(`locations`, `search_query`, [req.query.data], 50 * 52 * 7 * 24 * 60 * 60 * 1000)
    .then((result) => {
      console.log(`74`, result)

      // if database provides valid data, return it
      if (result) {
        res.send(result[0]);
        console.log('location sent back', result);
        return;
      }

      apiCall(`locations`, req.query.data, `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.data}&key=${process.env.GEOCODE_API_KEY}`, res)

      console.log('location sent back');
      // res.send(stuff[0]);

    })
}

function getWeather(req, res) {
  const sqlSearch = checkCache(`weathers`, `location_id`, [req.query.data.id], 15 * 1000)
    .then((result) => {
      // console.log(`74`, result)

      // if database provides valid data, return it
      if (result) {
        res.send(result);
        // console.log('location sent back', result);
        return;
      }

      const newData = apiCall(`weathers`, req.query.data, `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${req.query.data.latitude},${req.query.data.longitude}`);
      // console.log('location sent back', newData);
      res.send(newData);
    })
}

function getMeetups(req, res) {
  const sqlSearch = checkCache(`meetups`, `location_id`, [req.query.data.id], 7 * 24 * 60 * 60 * 1000)
    .then((result) => {

      // if database provides valid data, return it
      if (result) {
        res.send(result);
        return;
      }

      const newData = apiCall(`meetups`, req.query.data, `https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&lon=${request.query.data.longitude}&page=20&lat=${req.query.data.latitude}&key=${process.env.MEETUP_API_KEY}`);

      res.send(newData);
    })
}


// *******************
// Helper Functions
// *******************

// Checks table for valid data and returns it
// If data is found and invalid, deletes it
// If no or invald data, returns null

function checkCache(sqlTable, sqlSearchField, values, timeOut) {
  // console.log(values);
  // console.log(`SELECT * FROM ${sqlTable} WHERE ${sqlSearchField}=$1;`);
  return client.query(`SELECT * FROM ${sqlTable} WHERE ${sqlSearchField}=$1;`, values)
    .then(result => {
      // console.log(`129`, result);
      if (result.rows.length > 0) {
        // using a placeholder until created times working
        // if (result.rows[0][1] > timeOut) {
        if (true) {
          // console.log(`131, checkCache returns`, result.rows)
          return result.rows;
        } else {
          client.query(`DELETE * FROM ${sqlTable} WHERE ${sqlSearchField}=$1`);
        }
      }
      return null;
    }).catch(console.error);
}

// Makes an API call, throws data into table, returns API results

function apiCall(sqlTable, location_id, apiUrl, res) {
  console.log(sqlTable);
  superagent.get(apiUrl)
    .then(result => {

      console.log(result.body);
      let relevantData;
      let output;
      let newSQL;
      let newValues;
      switch (sqlTable) {

        case `locations`:

          output = new Location(location_id, result.body.results[0]);
          console.log(output);

          // Create a query string to INSERT a new record with the location data
          newSQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id;`;
          // console.log('102', newSQL)
          newValues = Object.values(output);
          // console.log('104', newValues)

          // Add the record to the database
          client.query(newSQL, newValues).then((result) => {
            output.id = result.rows[0].id;
            res.send(output);
          })

          // response.send(output);

          break;

        case `weathers`:
          output = result.body.daily.data.map(day => {
            return new Weather(day);
          });
          newSQL = `INSERT INTO weathers(forecast, time, location_id) VALUES($1, $2, $3);`;
          // console.log('153', weatherSummaries);
          output.forEach(summary => {
            let newValues = Object.values(summary);
            newValues.push(location_id);
            // Add the recod to th database
            return client.query(newSQL, newValues)
              .catch(console.error);
          })

          // response.send(output);

          break;

        case `meetups`:
          output = result.body.events.map(meetup => {
            const event = new Meetup(meetup);
            return event;
          });

          //SQL TIME
          ewSQL = `INSERT INTO meetups(link, name, creation_date, host, location_id) VALUES($1, $2, $3, $4, $5);`;
          output.forEach(meetup => {
            let newValues = Object.values(meetup);
            newValues.push(request.query.data.id);
            // add the record
            return client.query(newSQL, newValues)
          })

          // response.send(output);
          break;

        case `yelps`:

          break;

        case `movies`:

          break;

        case `trails`:


      }
      return output;
    }
    ).catch(console.error);
}


