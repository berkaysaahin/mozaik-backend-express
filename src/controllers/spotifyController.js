const { searchTracks } = require('../config/spotify');

const spotifyController = {
  async trackList(req, res) {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      const simplifiedResults = await searchTracks(query);
      res.json(simplifiedResults);
    } catch (error) {
      console.error('Error searching Spotify:', error);
      res.status(500).json({ error: 'Failed to search Spotify' });
    }
  },
};

module.exports = spotifyController;