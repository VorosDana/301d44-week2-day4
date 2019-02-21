# Lab08 – SQL Database Persistence

## Setup

1. Create a new repo called `lab-08-sql`
1. Clone the repo on your local machine
1. Copy your files from lab-07 into the newly cloned repo folder.  (NOTE: do not copy the `.git` file)
1. Make sure you have `.gitignore`, `.env`, and `eslintrc.json`

## Verify Postgresql

1. Run `psql` and verify that your database server is started.
 * IF `psql` doesn't start - that means your service is not running.
 * START the `postgresql` service
 
    * Mac ```brew services start postgresql```
        
    * Windows/Ubuntu ```sudu service postgresql start```
    
1. List your databases: `\l` <enter>
1. If `city_explorer` exists: `\c city_explorer` <enter>
  * If it doesn't exist: `CREATE DATABASE city_explorer` and then run `\c city_explorer`

1. Run `\dt` and verify that no relations exist.

## Create schema.sql 

1. Create a `schema.sql` file in the `/data` directory of your repo.
1. Open VSCode and edit `schema.sql`
1. Add the schema information into the `schema.sql` file and save the file.

## Load `schema.sql` into `city_explorer`
1. In your terminal, change to the `/data` directory of your repo.
1. Load the schema with psql: `psql -f schema.sql -d city_explorer`
1. Verify in psql that the tables now exist using the commands above.

## server.js
1. Open `server.js` in VSCode

## Database connection
Add the necessary code to connect to the database server
* database connection URL in the `.env`
* `npm i pg`
* `Client connection code from image 1

## Location
* Verify location works in City Explorer.
* Check your database table in psql and verify there is content being saved: `SELECT * FROM locations`

## Weather
* AFTER Location is working, complete the weather code using the code printout
* Verify that Weather is functional

## Meetups
Use your knowledge from above to create the Meetups route.


