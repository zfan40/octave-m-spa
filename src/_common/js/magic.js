const Tone = require('tone');

let notesObj = {};
let notesArray = [];
let FreqsResult = [];

// notesInfo example
// let work = [{note: "E4", time: 0.14585000000000037},
// {note: "G4", time: 1.0295},
// {note: "G4", time: 1.3985},
// {note: "E4", time: 2.6605300000000005},
// {note: "D4", time: 3.4207450000000006},
// {note: "C4", time: 4.196245000000001},
// {note: "G4", time: 2.671395000000004},
// {note: "A4", time: 3.35932},
// {note: "B4", time: 4.183044999999998}]
export function generateFreqs(notesInfo) {
  notesObj = {};
  notesArray = [];
  FreqsResult = [];
  console.log(notesInfo);
  notesInfo.forEach((item) => {
    // console.log(item.note)
    // console.log(notesObj)
    if (!(item.note in notesObj)) {
      console.log('!!');
      notesObj[item.note] = 1;
      notesArray.push({
        note: item.note,
        freq: Tone.Frequency(item.note).toFrequency(),
      });
    }
  });
  notesArray.sort((a, b) => (a.freq - b.freq));
  console.log(`本首作品共有${notesArray.length}种音符`);
  notesArray.forEach((item, index) => {
    FreqsResult.push(item.freq * 2);
    notesObj[item.note] = index + 1;
  });
  console.log('它们的频率是', FreqsResult);
  return FreqsResult;
}

export function generateJSCadCode(notesInfo) {
  let musicboxPins = [];
  // norm timing to 15 second
  const lastNoteTime = notesInfo[notesInfo.length - 1].time;
  if (lastNoteTime > 15) {
    notesInfo.forEach((item) => {
      item.time = (item.time * 15) / lastNoteTime;
    });
  }

  generateFreqs(notesInfo);
  musicboxPins = notesInfo.map(item => `generatePin(${item.time},${notesObj[item.note]})`);
  console.log(`
  const DOT_WIDTH = 0.6
  const RATIO = 0.98
  const OFFSET = 2.2 //1.95 is center
  const OUTER_RADIUS = 6.6
  const INNER_RADIUS = 5.9
  function generatePin(noteSec, noteNo) {
    return rotate(90, [1, 0, 4 * noteSec * RATIO / 15], cylinder({
      h: 1,
      r: DOT_WIDTH / 2,
      center: true
    })).translate([sin(360 * noteSec * RATIO / 15) * OUTER_RADIUS, -cos(360 * noteSec * RATIO / 15) * OUTER_RADIUS, -9.95 + OFFSET + 0.4 + (noteNo - 1) * .9])
  }

  function main() {
    let cylinderBody = difference(cylinder({h: 19.9,r: OUTER_RADIUS,center: true}),cylinder({h: 19.9,r: INNER_RADIUS,center: true}))
    let holes = union(${musicboxPins})
    return union(cylinderBody,holes).translate([0, 0, 0]).scale(1);
  }`);
}

export function mapNoteTimeToColor(time) {
  // let rgb = [0, 0, 0];
  const COLOR1 = [151, 255, 241];
  const COLOR2 = [98, 166, 223];
  const COLOR3 = [154, 124, 255];
  const TIME_MAX = 20;
  let rgb = [0, 0, 0];
  if (time < 0 || time > TIME_MAX) {
    // console.warn('we don\'t allow time above 20. from \'mapNoteTimeToColor\' util function');
  } else if (time <= 10) {
    rgb = [COLOR1[0] + ((time * (COLOR2[0] - COLOR1[0])) / (TIME_MAX / 2)),
      COLOR1[1] + ((time * (COLOR2[1] - COLOR1[1])) / (TIME_MAX / 2)),
      COLOR1[2] + ((time * (COLOR2[2] - COLOR1[2])) / (TIME_MAX / 2))];
  }
  rgb = [COLOR2[0] + ((time * (COLOR3[0] - COLOR2[0])) / (TIME_MAX / 2)),
    COLOR2[1] + ((time * (COLOR3[1] - COLOR2[1])) / (TIME_MAX / 2)),
    COLOR2[2] + ((time * (COLOR3[2] - COLOR2[2])) / (TIME_MAX / 2))];
  // console.log(`rgb(${Math.floor(rgb[0])},${Math.floor(rgb[1])},${Math.floor(rgb[2])})`);
  return `rgb(${Math.floor(rgb[0])},${Math.floor(rgb[1])},${Math.floor(rgb[2])})`;
}
export function mapNoteMidiToLength(noteName) {
  // in our context, the midi range would be from 60 - 84
  return `${(75 * 0.8 * ((Tone.Frequency(noteName).toMidi() - 60) / (84 - 40))) + 0.2}`; // 75 is rem to px
}
