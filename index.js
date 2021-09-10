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

const cors = require("cors");
let allowedOrigins = [
  "http://localhost:8080", 
  "https://myflix-57495.herokuapp.com/login", 
  "http://localhost", 
  "http://localhost:1234", 
  "http://localhost:4200",
  "https://james-myflix.netlify.app",
  "http://james-myflix.netlify.app",
  "james-myflix.netlify.app"
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

//get list of movies
app.get("/movies", passport.authenticate("jwt", {session: false}), (req, res) => {
  Movies.find().then((movies) => {
    res.status(201).json(movies);
  }).catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

//Puts a message on the page
app.get("/", (req, res) => {
  res.send("Welcome to the greatest movie app of all time!");
});

//Get information on a particular movie
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

//Creates a user based on their input information.  Checks if the username already exists before creation.
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


//Get a users information. Does not return the user's password
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

//Allows a username to update their information
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

//Allows a user to view their list of favorite movies
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

//Adds a movie to a users list of favorite movies by using the movieid as a parameter
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


//Deletes a movie from a users favorites movie list by using the id as a parameter.
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

//Deletes a user from the database
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

//Looks in the Movies collection for a document containing the desired genre, then displays that genre's description
app.get("/genres/:genre", passport.authenticate("jwt", {session: false}), (req, res) => {
  Movies.findOne({"Genre.Name": req.params.genre})
    .then((genre) => {
      res.json(genre.Genre);
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Looks in Movies collection for a document containing the desired director, then displays that director's information
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