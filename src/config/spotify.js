const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});

async function getAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    console.log('Access Token Data:', data);
    return data.body.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

async function getSimplifiedTrackDetails(trackId) {
  try {
    const accessToken = await getAccessToken();
    spotifyApi.setAccessToken(accessToken);

    const trackDetails = await spotifyApi.getTrack(trackId);

    const simplifiedTrackDetails = {
      track_name: trackDetails.body.name,
      artist: trackDetails.body.artists.map((artist) => artist.name).join(', '),
      cover_art: trackDetails.body.album.images[0]?.url, 
      spotify_url: trackDetails.body.external_urls.spotify,
    };

    return simplifiedTrackDetails;
  } catch (error) {
    console.error('Error fetching track details:', error);
    throw error;
  }
}

async function searchTracks(query) {
  try {
    const accessToken = await getAccessToken();
    spotifyApi.setAccessToken(accessToken);

    const searchResults = await spotifyApi.searchTracks(query, { limit: 10 });

    const simplifiedResults = searchResults.body.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(', '),
      imageUrl: track.album.images[0]?.url,
    }));

    return simplifiedResults;
  } catch (error) {
    console.error('Error searching Spotify:', error);
    throw error;
  }
}

module.exports = { getSimplifiedTrackDetails, searchTracks, getAccessToken };