
export function getDateDiff(dateTimeStamp) {
  let result = ''
  // some are"2019-03-12 22:54:36", some are 1552399367000
  // alert(+ new Date(dateTimeStamp))
  const newdateTimeStamp = typeof dateTimeStamp === 'string' ? + new Date(dateTimeStamp.replace(/-/g, '/')) : dateTimeStamp
  var minute = 1000 * 60;
  var hour = minute * 60;
  var day = hour * 24;
  var halfamonth = day * 15;
  var month = day * 30;
  var year = month * 12;
  var now = new Date().getTime();
  var diffValue = now - newdateTimeStamp;
  if (diffValue < 0) { return; }
  var yearC = diffValue / year;
  var monthC = diffValue / month;
  var weekC = diffValue / (7 * day);
  var dayC = diffValue / day;
  var hourC = diffValue / hour;
  var minC = diffValue / minute;
  if (yearC >= 1) {
    result = "" + parseInt(yearC) + "年前";
  }
  else if (monthC >= 1) {
    result = "" + parseInt(monthC) + "月前";
  }
  else if (weekC >= 1) {
    result = "" + parseInt(weekC) + "周前";
  }
  else if (dayC >= 1) {
    result = "" + parseInt(dayC) + "天前";
  }
  else if (hourC >= 1) {
    result = "" + parseInt(hourC) + "小时前";
  }
  else if (minC >= 1) {
    result = "" + parseInt(minC) + "分钟前";
  } else
    result = "刚刚";
  return result;
}
export function toMidi(midiNum) {
  return Tone.Frequency(midiNum, "midi").toNote()
}