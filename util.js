const axios = require('axios');
const waveFormStyleAttributes = {
  minimumHeight: 5
}

const getTrackWaveFormData = async (trackId, token, tracksObject) => {


  try {

    console.log(`Sending Track audio analytics request [Track ID: ${trackId}]`);
    
    const res = 
      await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, 
        { headers: { "Authorization": `Bearer ${token}` }}
      );

    console.log(`Track audio analytics received, processing ... [Track ID: ${trackId}]`);
    const segmentsData = res.data.segments;

    tracksObject.levels = convertSegmentToLevels(segmentsData, tracksObject.durationSecond)
    console.log("Track processed");
  } catch (err) {
      console.log(err);
      console.log("error");
  }
};

const convertSegmentToLevels = (segmentsArray, duration) => {
  let segments = segmentsArray.map(segment => {
    return {
      start: segment.start / duration,
      duration: segment.duration / duration,
      loudness: 1 - (Math.min(Math.max(segment.loudness_max, -35), 0) / -35)
    }
  });

  let max = Math.max(...segments.map(s => s.loudness))

  let levels = []

  for (let i = 0.000; i < 1; i += 0.001) {
    let s = segments.find(segment => {
      return i <= segment.start + segment.duration
    });

    let loudness = Math.round((s.loudness / max) * 100) / 100;
    if(loudness == 0) loudness = waveFormStyleAttributes.minimumHeight / 100;

    levels.push(loudness);
  }

  return levels;
};


const msToMinuteStamp = durationInMs => {
  durationInS = durationInMs / 1000;
  return `${parseInt(durationInS / 60)}:${parseInt(durationInS % 60)}`;
};

module.exports.getTrackWaveFormData = getTrackWaveFormData;
module.exports.msToMinuteStamp = msToMinuteStamp