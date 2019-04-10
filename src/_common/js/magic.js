const Tone = require('tone');
var toWav = require('audiobuffer-to-wav')

Tone.Transport.cancel();
const SAME_NOTE_INTERVAL = 1; // 同一个音不能相距小于1秒，不然音片打击出问题
let musicPreview;

let oncePlayed = false;
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
// const mbox = new Tone.MonoSynth({
//   volume: -10,
//   envelope: {
//     attack: 0.1,
//     decay: 0.3,
//     release: 2,
//   },
//   filterEnvelope: {
//     attack: 0.001,
//     decay: 0.01,
//     sustain: 0.5,
//     baseFrequency: 200,
//     octaves: 2.6,
//   },
// }).toMaster();
// const mbox = new Tone.PolySynth(6, Tone.Synth, {
//   oscillator: {
//     partials: [0, 2, 3, 4],
//   },
// }).toMaster();
// const mbox = new Tone.Sampler({
//   C4: 'C4.[mp3|ogg]',
//   'D#4': 'Ds4.[mp3|ogg]',
//   'F#4': 'Fs4.[mp3|ogg]',
//   A4: 'A4.[mp3|ogg]',
//   C5: 'C5.[mp3|ogg]',
//   'D#5': 'Ds5.[mp3|ogg]',
//   'F#5': 'Fs5.[mp3|ogg]',
//   A5: 'A5.[mp3|ogg]',
//   C6: 'C6.[mp3|ogg]',
// }, {
//   release: 1,
//   baseUrl: '/static/audio/',
// }).toMaster();
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const mbox = new Tone.Sampler(
  {
    B3: 'B3.[mp3|ogg]',
    E4: 'E4.[mp3|ogg]',
    G4: 'G4.[mp3|ogg]',
    B4: 'B4.[mp3|ogg]',
    'C#5': 'Cs5.[mp3|ogg]',
    E5: 'E5.[mp3|ogg]',
    G5: 'G5.[mp3|ogg]',
    B5: 'B5.[mp3|ogg]',
    'C#6': 'Cs6.[mp3|ogg]',
  },
  {
    release: 1,
    // baseUrl: '/static/audio/mbox/',
    baseUrl: '//cnbj1.fds.api.xiaomi.com/mbox/audio/mbox/',
  },
).toMaster();

export function RealMagic(items) {
  console.log('== Enter RealMagic ==');
  console.log(JSON.stringify(items));
  const tasksObj = {};
  items.forEach((item) => {
    //* 2 cuz print mbox need 1 octave higher.
    const itemNoteFreq = parseInt(Tone.Frequency(item.note).toFrequency() * 2, 10);
    if (!tasksObj[itemNoteFreq]) {
      tasksObj[itemNoteFreq] = [];
    }
    tasksObj[itemNoteFreq].push(item.time);
  });
  // tasksObj is like {784:[1.0295,1.39,2.6713],659:[2.66],...}

  // then we focus on each task
  const taskTypes = Object.keys(tasksObj); // [659,784,...]  freq array, 排好序的（object.keys）
  const taskTimeArrays = Object.values(tasksObj); // [[2.66]，[1.0295,1.39,2.6713]] 顺序跟上面对应的
  // const taskTimeArraysCycle = taskTimeArrays.map(a => a.map(b => [b, b + 20]).flat().sort((a, b) => a - b)) //考虑首位交接[[2.66,22.66],[1.0295,1.39,2.6713,21.0295,21.39,22.6713]]
  const taskTimeArraysCycle = taskTimeArrays.map(a => a.map(b => [b, b + 20]).reduce((acc, val) => acc.concat(val), []).sort((a, b) => a - b)) //flat方法摩羯浏览器不支持

  const machines = []; // init with existing types, will add more machines
  const groups = []; // will final be [[1],[1,2,1],...], corespond to taskTimeArrays

  if (taskTypes.length > 18) {
    console.log('音种类超过18个，这个做不了');
    return false;
  }

  taskTimeArraysCycle.forEach((timeArray) => {
    const final = [];
    timeArray.forEach((time, j) => {
      const test = []; // 校验当前final里不能用的序号， final里序号种类和test种类相同则证明不行
      let allPreviousOccupied = false;
      let successFound = false;
      if (j === 0) {
        final.push(1); // 给第1组的第一个任务分配第一个机器
      } else {
        let counter = j;
        while (counter >= 1 && !allPreviousOccupied) {
          // TODO: -1 or 0
          counter -= 1;
          if (
            time - timeArray[counter] >= SAME_NOTE_INTERVAL &&
            test.indexOf(final[counter]) === -1
          ) {
            final.push(final[counter]);
            successFound = true;
            break;
          } else if (test.indexOf(final[counter]) === -1) {
            test.push(final[counter]);
            if ([...new Set(final)].length === [...new Set(test)].length) {
              // final目前已有的都不满足，set可以取unique elements [1,1,2,2,3,1] => [1,2,3]
              allPreviousOccupied = true;
              break;
            }
          }
        }
        if ((counter === 0 && !successFound) || allPreviousOccupied) {
          final.push(Math.max(...final) + 1);
        }
      }
    });
    groups.push(final);
  });
  console.log(taskTypes);
  console.log(taskTimeArrays);
  console.log('hehe', groups); // [[1],[1,2,1],...], corespond to taskTimeArrays

  // now we have groups, let's build machines based on this
  groups.forEach((group, index) => {
    let count = 0;
    while (count <= Math.max(...group) - 1) {
      machines.push(taskTypes[index]);
      count += 1;
    }
  });
  if (machines.length < 18) {
    const lastMachine = machines[machines.length - 1];
    while (machines.length < 18) {
      machines.push(lastMachine); // make it length of 18
    }
    // machines is like ["1046", "1174", "1318", "1318", "1318", "1396", "1567"] of 18 length
  } else if (machines.length > 18) {
    console.log('所需音片儿超过18个');
    return false;
  }
  return true;
}

export function mapNoteTimeToColor(time) {
  const COLOR1 = [151, 255, 241];
  const COLOR2 = [137, 228, 217];
  const COLOR3 = [143, 123, 242];
  const TIME_MAX = 20;
  let rgb = [0, 0, 0];
  if (time < 0 || time > TIME_MAX) {
    // console.warn('we don\'t allow time above 20. from \'mapNoteTimeToColor\' util function');
  } else if (time <= 10) {
    rgb = [
      COLOR1[0] + time * (COLOR2[0] - COLOR1[0]) / (TIME_MAX / 2),
      COLOR1[1] + time * (COLOR2[1] - COLOR1[1]) / (TIME_MAX / 2),
      COLOR1[2] + time * (COLOR2[2] - COLOR1[2]) / (TIME_MAX / 2),
    ];
  }
  rgb = [
    COLOR2[0] + time * (COLOR3[0] - COLOR2[0]) / (TIME_MAX / 2),
    COLOR2[1] + time * (COLOR3[1] - COLOR2[1]) / (TIME_MAX / 2),
    COLOR2[2] + time * (COLOR3[2] - COLOR2[2]) / (TIME_MAX / 2),
  ];
  // console.log(`rgb(${Math.floor(rgb[0])},${Math.floor(rgb[1])},${Math.floor(rgb[2])})`);
  return `rgb(${Math.floor(rgb[0])},${Math.floor(rgb[1])},${Math.floor(rgb[2])})`;
}
export function mapNoteMidiToLength(noteName) {
  // in our context, the midi range would be from 60 - 84
  // 75 is rem to px
  // return `${(75 * 0.8 * ((Tone.Frequency(noteName).toMidi() - 60) / (84 - 40))) + 0.2}`;
  // 50 - 110
  return `${75 * 0.8 * ((Tone.Frequency(noteName).toMidi() - 50) / (110 - 40)) + 0.2}`; // 75 is rem to px
}

export function clearTone(parts) {
  // 本方法只为Tone.js不在各页面中全局污染，完全是作者这包操蛋
  if (parts && parts.length) {
    // 传进来值 挨个dispose。。。
    parts.forEach((part) => {
      try {
        part.dispose();
      } catch (e) {
        //
      }
    });
  }
  if (musicPreview) {
    // 清理自己的musicPreview
    try {
      musicPreview.dispose();
    } catch (e) {
      //
    }
  }
}
export function preview(items, start) {
  console.log('current state', Tone.Transport.state);
  // if (Tone.Transport.state === 'stopped') {
  if (start) {
    // TODO: this is weird...but you need to play something to make sure it works
    // trigger to avoid no sound
    if (!oncePlayed) {
      console.log('pp')
      mbox.triggerAttack('E6', 0, 0);
      oncePlayed = true;
    }
    if (musicPreview) {
      try {
        musicPreview.dispose();
      } catch (e) {
        //
      }
    }
    musicPreview = new Tone.Part((time, value) => {
      // mbox.triggerAttackRelease(value.note, '4n', time);
      mbox.triggerAttackRelease(Tone.Frequency(value.midi, 'midi'), '2n', time);
    }, items).start(0, 0);
    musicPreview.loop = true;

    const lastNote = items[items.length - 1]
    if (lastNote.time >= 20) {
      musicPreview.loopEnd = lastNote.time + lastNote.duration + 2
    } else {
      musicPreview.loopEnd = 20; // 20s的作品，以前21秒，现在就20正好，弄啥样啥样，所听即所得
    }
    Tone.Transport.position = 0;
    Tone.Transport.start('+0.01', 0);
  } else {
    Tone.Transport.stop(0);
  }
}

export function previewMidi(url, start) {
  // TODO why so fucking tricky
  if (!oncePlayed) {
    console.log('ppp')
    mbox.triggerAttack('E6', 0, 0);
    oncePlayed = true;
  }
  // try {
  console.log('midi---url', url)
  MidiConvert.load(url, (midi) => {
    console.log('dasdsad', midi)
    const mergeNotes = midi.tracks.reduce((a, b) => a.concat(b.notes), []);
    // alert(mergeNotes)
    preview(mergeNotes, start)
  });
  // } catch (error) {
  //   console.log(3333)
  //   alert(error)
  // }
}
export function bounceToWav(url) {
  MidiConvert.load(url, (midi) => {
    // https://github.com/Tonejs/Tone.js/issues/368
    function renderOffline(callback, duration) {
      // Set the OfflineAudioContext
      let sampleRate = Tone.context.sampleRate
      let originalContext = Tone.context
      // Make sure to preserve original Transport if it has not be cached on the context yet
      if (!originalContext.Transport) originalContext.Transport = Tone.Transport
      // Create new OfflineContext and make it the default context
      let context = new Tone.OfflineContext(2, duration, sampleRate)
      Tone.context = context
      function onReady() {
        // process the audio
        var rendered = context.render()
        // return the original AudioContext
        Tone.context = originalContext
        // return the audio
        return rendered.then(function (buffer) {
          // wrap it in a Tone.Buffer
          return new Tone.Buffer(buffer)
        })
      }
      // invoke the callback/scheduling
      callback(Tone.Transport, onReady)
    }


    renderOffline((Transport, render) => {
      const synth = new Tone.Sampler({
        B3: 'B3.[mp3]',
        E4: 'E4.[mp3]',
        G4: 'G4.[mp3]',
        B4: 'B4.[mp3]',
        'C#5': 'Cs5.[mp3]',
        E5: 'E5.[mp3]',
        G5: 'G5.[mp3]',
        B5: 'B5.[mp3]',
        'C#6': 'Cs6.[mp3]',
      }, onSynthLoaded, '//cnbj1.fds.api.xiaomi.com/mbox/audio/mbox/').toMaster();

      function onSynthLoaded() {
        const mergeNotes = midi.tracks.reduce((a, b) => a.concat(b.notes), []);
        mergeNotes.forEach(note => {
          synth.triggerAttackRelease(Tone.Frequency(note.midi, 'midi'), '2n', note.time);
        })
        render().then((buffer) => {
          //do something with the output buffer
          var anchor = document.createElement('a')
          document.body.appendChild(anchor)
          anchor.style = 'display: none'
          // alert('CONG')
          console.log(buffer)
          console.log(buffer.getChannelData())
          buffer.sampleRate = 44100 // 我艹这神了。。。没这个不行，不然读不出来sampleRate
          var wav = toWav(buffer)
          var blob = new window.Blob([new DataView(wav)], {
            type: 'audio/wav'
          })

          var url = window.URL.createObjectURL(blob)

          anchor.href = url
          anchor.download = 'audio.wav'
          anchor.click()
          window.URL.revokeObjectURL(url)
        })
      }
    }, 20)

  });
}

export function canMakePaper30(items) {
  const paper30Notes = [48, 50, 55, 57, 59, 60, 62, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 86, 88]
  return items.every(item => paper30Notes.indexOf(item) >= 0)
}
export function canMakePaper15(items) {
  const paper15Notes = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72]
  return items.every(item => paper15Notes.indexOf(item) >= 0)
}
