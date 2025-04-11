const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const spotifyRoutes = require('./routes/spotifyRouter')
const session = require('express-session');
const passport = require('passport');
require('./config/passport');


const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
app.use(cors());
app.use(bodyParser.json());

app.use('/api/spotify', spotifyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

module.exports = app;