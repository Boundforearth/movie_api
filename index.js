// Import express and morgan
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Models = require("./models.js");

const app = express();
app.use(bodyParser.json());

const Movies = Models.Movie;
const Users = Models.User;
//Morgan will log basic info to console
app.use(morgan("common"));

mongoose.connect("mongodb://localhost:27017/myFlixDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

//Grab static pages from "public" folder
app.use('/', express.static('public'));

//error handling function for app problems
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Maybe not the greatest after all...")
});

//get list of movies
app.get("/movies", (req, res) => {
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
app.get("/movies/:movie", (req, res) => {
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
app.post("/users", (req, res) => {
  Users.findOne({Username: req.body.Username})
    .then((user) => {
      if(user) {
        return res.status(400).send(req.body.Username + "already exists.")
      }
      else {
        Users.create({
          Username: req.body.Username,
          Password: req.body.Password,
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

app.get("/users/:user", (req, res) => {
  Users.findOne({Username: req.params.user})
    .then((user) => {
      res.status(201).json(user);
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Allows a username to update their information
app.put("/users/:username", (req, res) => {
  Users.findOneAndUpdate({Username: req.params.username}, 
    {$set: {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }})
    .then((user) => {
      res.send("Your profile information has been updated!");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    })
});

//Allows a user to view their list of favorite movies
app.get("/users/:username/mylist", (req, res) => {
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
app.post("/users/:username/mylist/:movieid", (req, res) => {
  Users.findOne({Username: req.params.username})
    .then((user) => {
      let favoritesArray = user.Favorites;
      console.log(favoritesArray);
      let sameMovieExists;
      let myMovie = req.params.movieid;
      for(i = 0; i < favoritesArray.length; i++) {
        if(favoritesArray[i] == myMovie) {
          sameMovieExists = myMovie;
        }
      }
      console.log(sameMovieExists + "  " + req.params.movieid)
      if(sameMovieExists === req.params.movieid) {
        res.status(400).send("That movie is already in your favorites!")
      }
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
app.delete("/users/:username/mylist/:movie", (req, res) => {
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

app.delete("/users/:username", (req, res) => {
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
app.get("/genres/:genre", (req, res) => {
  Movies.findOne({"Genre.Name": req.params.genre})
    .then((genre) => {
      res.json(genre.Genre);
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Looks in Movies collection for a document containing the desired director, then displays that director's information
app.get("/directors/:director", (req, res) => {
  Movies.findOne({"Director.Name": req.params.director})
    .then((director) => {
      res.json(director.Director);
    }).catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Server on port 8080
app.listen(8080, function() {
  console.log("I am a server");
});