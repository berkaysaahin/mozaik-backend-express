const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');

router.get('/search', spotifyController.trackList);

module.exports = router;