const express = require('express'); 
const spotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const getTrackWaveFormData = require('./util.js').getTrackWaveFormData;
const msToMinuteStamp = require('./util.js').msToMinuteStamp;


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken

  const spotifyApi = new spotifyWebApi({
    redirectUri: "http://localhost:3000",
    clientId: "a1c5e1d9893f455ca311ec8e8eb32686",
    clientSecret: "fe49a7ab0f7a4e5cb70f885ed1d30fd2",
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      })
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

  


app.post('/login',  (req, res) => {
  const code = req.body.code;

  const spotifyApi = new spotifyWebApi({
    redirectUri: "http://localhost:3000",
    clientId: "a1c5e1d9893f455ca311ec8e8eb32686",
    clientSecret: "fe49a7ab0f7a4e5cb70f885ed1d30fd2",
  });
  spotifyApi.authorizationCodeGrant(code).then(data => {
    res.json({
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresIn: data.body.expires_in,
    })
  }).catch((err) => {
    res.sendStatus(400);
    console.log(err)
  })
})



console.log("Try sending a POST request to http://localhost:3001/waveForms with a JSON payload containing 'albumID' and 'auth_token'(optional) ")
app.post('/waveforms', async (req, res) => {

  const albumID = req.body.album_id;
  const oAuthToken = req.body.auth_token || "BQCyv6TDVpI572gNDLh2E9LzHCXL1ArFUZBxIBh3DirhN-HZL9M-UwRaGpy6p-siXgE_sKKFTlxiu-MItISWTpb0pzjEHOsK48DEdEnT7ODoQrMj6CfzH70JwrfdZ_60lFZtCIM7yQcACFDP5eoeQKbUamK1fifRdh0BraUlzPfazXkrR2Ypb5kNw7cKDRYdBbyUkpdy3jQayJ7LW6yQ";

  const albumResponse = await axios.get(`https://api.spotify.com/v1/albums/${albumID}`, {
    headers: {
      'Authorization': `Bearer ${oAuthToken}`
    }
  });

  const rawTracksObjects = albumResponse.data.tracks.items;

  let tracksObjects = rawTracksObjects.map(
    (rawTrack) => {
      return {
        trackId: rawTrack.id,
        name: rawTrack.name,
        durationMinute: msToMinuteStamp(rawTrack.duration_ms), // ms to minute
        durationSecond: parseInt(rawTrack.duration_ms / 1000) // ms to second
      }
    });
  
  await Promise.all(
    [...tracksObjects.map(trackObject => getTrackWaveFormData(trackObject.trackId, oAuthToken, trackObject))]
  );
  
  console.log(tracksObjects);
  res.json({tracksObjects});
  
  // res.send('GET request to the homepage');



})





app.listen(3001)