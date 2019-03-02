#301d44-Lab-06-Day-1
Authors: Dana Voros and Peter Murphy

##Overview
This project is built to serve as the back end server for a provided front end. The front end takes a location name input, and shows a map, weather information, local meetups and yelp reviews, hiking trails, and related movies.

##Getting Started
Provide the link to this server to the front end page.

##Architecture
The front end makes a call to the server with a location, the server requests a latitude and longitude from Google's geocode API and sends it back to the front. The front end then sends that location back for each API call - Yelp, Meetup, Dark Sky, MovieDB, and Hiking Project. All data is cached in a Postgresql database to minimize repeat API calls - the cached data is sent instead of calling to the API if it exists. The front end site handles all displaying of the data.

Change Log
2/19/19 Initial Commit
2/20/19 Initial API call work
2/21/19 SQL cacheing added
2/22/19 Additional API calls added

Setup:
estimate: 20m
actual: 30m

Location route
estimate: 1h
actual: 70m

Location Contruction
Estimate: 30m
actual: 20m

Weather function
estimate: 40m

error handling 
estimate 15 minutes;
actual 30 minutes;

API calls:
estimate: 3 hours
actual: 4 hours

Debugging meetup API:
estmate: 30m
actual: 30m

SQL:
estimate: 2 hours
actual: 3 hours

Additional APIs:
estimate: 2 hours
actual: 5 hours

Deployment:
estimate: 1 hour
actual: 30m