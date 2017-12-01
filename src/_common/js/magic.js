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
        freq: Tone.Frequency(item.note)._expr(),
      });
    }
  });
  notesArray.sort((a, b) => (a.freq - b.freq));
  console.log(`本首作品共有${notesArray.length}种音符`);
  notesArray.forEach((item, index) => {
    FreqsResult.push(item.freq);
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
  const RATIO = 0.9

  function generatePin(noteSec, noteNo) {
    return rotate(90, [1, 0, 4 * noteSec * RATIO / 15], cylinder({
      h: 1,
      r: DOT_WIDTH / 2,
      center: true
    })).translate([sin(360 * noteSec * RATIO / 15) * 6.6, -cos(360 * noteSec * RATIO / 15) * 6.6, -9.95 + 1.95 + 0.4 + (noteNo - 1) * .9])
  }

  function main() {
    let cylinderBody = difference(cylinder({h: 19.9,r: 6.6,center: true}),cylinder({h: 19.9,r: 5.6,center: true}))
    let holes = union(${musicboxPins})
    return union(cylinderBody,holes).translate([0, 0, 0]).scale(1);
  }`);
}
