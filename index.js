// Import Dependencies
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Models = require("./models.js");
const {check, validationResult} = require("express-validator");

const app = express();
app.use(bodyParser.json());

const passport = require('passport');
require('./passport');

/** 
 * list of all allowed origins. 
 * If you use this code, add your own origins
*/

const cors = require("cors");
let allowedOrigins = [
  "http://localhost:8080", 
  "https://myflix-57495.herokuapp.com/login", 
  "http://localhost", 
  "http://localhost:1234", 
  "http://localhost:4200",
  "https://james-myflix.netlify.app",
  "http://james-myflix.netlify.app",
  "james-myflix.netlify.app",
  "https://boundforearth.github.io",
  "http://boundforearth.github.io",
  "boundforearth.github.io",
  
];
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) {return callback(null, true);}
    if(allowedOrigins.indexOf(origin) === -1) {
      // If s specific origin isn't found on the list of allowed origins
      let message = "The CORS policy for this application doesn't allow access from origin " + origin;
      return callback( new Error(message), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth')(app);

//local mongoose.connect for possible testing purposes
//mongoose.connect("mongodb://localhost:27017/myFlixDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

//connect to online database
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
  .catch((err) => {
    console.log(err);
  });

const Movies = Models.Movie;
const Users = Models.User;
//Morgan will log basic info to console
app.use(morgan("common"));


//Grab static pages from "public" folder
app.use('/', express.static('public'));

//error handling function for app problems
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Maybe not the greatest after all...")
});

/**
 * Gets an array of movie objects from the database
 * @method GET
 * @param {string} - endpoint url/movies
 * @returns {Object} Returns an Object of movie objects.
 * Each object has _id, Title, Description, Genre, Director, ImagePath, and Featured keys
 */
app.get("/movies", passport.authenticate("jwt", {session: false}), (req, res) => {
  Movies.find().then((movies) => {
    res.status(201).json(movies);
  }).catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

/**
 * @method GET
 * @param {string} - endpoint url/
 * @returns {string} Just returns a welcome message
 */
//Puts a message on the page
app.get("/", (req, res) => {
  res.send("Welcome to the greatest movie app of all time!");
});

/**
 * Gets s single movie from the database
 * @method GET
 * @param {string} - endpoint url/moives/:movie :movie must be provided
 * @returns {Object} Returns a single movie object with _id, Title, Description, Genre, Director, ImagePath, and Featured keys
 * displays error message on failure
 */
app.get("/movies/:movie", passport.authenticate("jwt", {session: false}), (req, res) => {
  Movies.findOne({Title: req.params.movie})
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * Creates a user account
 * @method POST 
 * @param {string} - endpoint url/users
 * @param {string} - Needs a Username, Password, Email, and Birthday
 * returns an error message or the user
 */
app.post("/users", 
//Validations for user registration
[check("Username", "Username must be at least 5 characters").isLength({min: 5}),
check("Username", "Username contains non-alphanumeric characters").isAlphanumeric(),
check("Password", "Password must be at least 8 characters").isLength({min: 8}),
check("Email", "Please enter a valid Email address").isEmail()], 
(req, res) => {
  //Check for errors in validation
  let errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }
  // Hash the password
  let hashedPassword = Users.hashPassword(req.body.Password);

  //Check if Username already exists
  Users.findOne({Username: req.body.Username})
    .then((user) => {
      if(user) {
        return res.status(400).send(req.body.Username + "already exists.")
      }
      //If Username does not already exist, run the remaining code
      else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }).then((user) => {
          res.status(201).json(user);
        }).catch((err) => {
          console.error(err);
          res.status(500).send("Error: " + err);
        })
      }
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});


/**
 * Gets a User from the database
 * @method GET
 * @param {string} - endpoint url/users/:user wher the user must be supplied
 * @returns {Object} returns a user object containing Username, Email, _id, Birthday, and Favorites keys
 * Returns an error message on failure
 */
app.get("/users/:user", passport.authenticate("jwt", {session: false}), (req, res) => {
  Users.findOne({Username: req.params.user})
    .then((user) => {
      res.status(201).json(
        {
          Username: user.Username,
          Email: user.Email,
          _id: user._id,
          Birthday: user.Birthday,
          Favorites: user.Favorites
        }
      );
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * Updates a users information in the database
 * @method PUT
 * @param {string} - endpoint url/users/:username  username needs to be supplied
 * @param {string} - Username, Password, Email and Birthday are all required 
 * @returns {statusMessage} - returns message telling user the results
 * upon failure, an error message
 * upon success, "Your username has been updated to Username"
 */
app.put("/users/:username",
//Validations for user registration
[check("Username", "Username must be at least 5 characters").isLength({min: 5}),
check("Username", "Username contains non-alphanumeric characters").isAlphanumeric(),
check("Password", "Password must be at least 8 characters").isLength({min: 8}),
check("Email", "Please enter a valid Email address").isEmail()],  
passport.authenticate("jwt", {session: false}), 
(req, res) => {

  //Check for errors in validation
  let errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  let hashedPassword = Users.hashPassword(req.body.Password);

  //Checks if the new username exists first
  Users.findOne({Username: req.body.Username})
    .then((user) => {
      //code that would be use to prevent changing to an existing user.
     // if(user) {
        //If the username already exists, the change is rejected
        //res.status(400).send("That username is already taken, please choose a different one.");
     // }
     // else {
        //If the new username does not exist, this code runs to update to the new username.
        Users.findOneAndUpdate({Username: req.params.username},
          {$set: {
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          }},
          {new: true})
          .then((user) => {
            res.status(201).send("Your username has been updated to " + user.Username);
          })
          .catch((err) => {
            console.log(err);
            res.status(500).send("Error: " + err);
          })
     // }
   });
  });

  /**
 * Gets a user's favorites from their database entry
 * @method GET
 * @param {string} - endpoint url/users/:username/mylist  :username must be supplied
 * @returns {Array} Array containing the users favorites containing movie id's only
 */
app.get("/users/:username/mylist", passport.authenticate("jwt", {session: false}), (req, res) => {
  Users.findOne({Username: req.params.username})
    .then((user) => {
      res.status(201).json(user.Favorites);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * Adds a movie to the user's favorites list
 * @method POST
 * @param {string} - endpoint url/users/:username/mylist/:movieid where :username and :movieid need to be supplied
 * @returns {statusMessage} returns a message containing the movie id
 * upon failure, "Error: " + error message
 * upon success, The movie with ID (id) has been added to your list
 * if movie is in favorites, That movie is already in your favorites
 */
app.post("/users/:username/mylist/:movieid", passport.authenticate("jwt", {session: false}), (req, res) => {
  Users.findOne({Username: req.params.username})
    .then((user) => {
      let favoritesArray = user.Favorites;
      console.log(favoritesArray);
      let sameMovieExists;
      let myMovie = req.params.movieid;
      //loop to run through array and check whether or not a movie is in the user's Favorites
      for(i = 0; i < favoritesArray.length; i++) {
        if(favoritesArray[i] == myMovie) {
          sameMovieExists = myMovie;
        }
      }
      if(sameMovieExists === req.params.movieid) {
        res.status(400).send("That movie is already in your favorites!")
      }
      //if movie not in favorites, this runs to update the code
      else {
        Users.findOneAndUpdate({Username: req.params.username},
          {$push: { Favorites: req.params.movieid}})
          .then((update) => {
            res.send("The movie with ID " + req.params.movieid + " has been added to your list!");
          }).catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
          })
      }
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});


/**
 * Removes a movie from a users favorites
 * @method DELETE
 * @param {string} - endpoint url/users/:username/mylist.:movie  where :username and :movie need to be supplied
 * @returns {statusMessage} return message with movie
 * upon failure, "Error: " + error message
 * upon success "MovieID" + id + "was deleted from your list displays"
 */
app.delete("/users/:username/mylist/:movie", passport.authenticate("jwt", {session: false}), (req, res) => {
  Users.findOneAndUpdate({Username: req.params.username}, 
    {$pull: {Favorites: req.params.movie}})
    .then((user) => {
      res.status(200).send("MovieID " + req.params.movie + " was deleted from your list.");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * Removes a user from the database
 * @method DELETE
 * @param {string} - endpoint url/users/ + a username
 * @returns {statusMessage} returnd the input username
 * upon failure, returns username was not found
 * upon success, returns username was deleted
 */
app.delete("/users/:username", passport.authenticate("jwt", {session: false}), (req, res) => {
  let username = req.params.username;
  Users.findOneAndRemove({Username: req.params.username})
    .then((user) => {
      if(!user) {
        res.status(400).send(username+ " was not found.");
      }
      else {
        res.status(200).send(username + " was deleted.");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});;

/**
 * Gets an array of movie objects from the database
 * @method GET
 * @param {string} - endpoint url/genres/ + a genre name
 * @returns {Object}  return Genre object containing Name and Description keys
 */
app.get("/genres/:genre", passport.authenticate("jwt", {session: false}), (req, res) => {
  Movies.findOne({"Genre.Name": req.params.genre})
    .then((genre) => {
      res.json(genre.Genre);
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

/**
 * Get a directors info from the movie collection
 * @method GET
 * @param {string}  - endpoint url/directors/ + a director's name
 * @returns {Object}  return a Directir object containing Name, Bio, Birth, Death as keys
 */
app.get("/directors/:director", passport.authenticate("jwt", {session: false}), (req, res) => {
  Movies.findOne({"Director.Name": req.params.director})
    .then((director) => {
      res.json(director.Director);
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log("Listening on Port " + port);
});