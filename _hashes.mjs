import { readFileSync } from 'fs';
import { createHash } from 'crypto';
const DIR = 'C:/Users/kutsk/AppData/Local/Temp/shots';
const map = [
["onb-00-welcome","81:6"],["onb-01-features","81:7"],["onb-02-benefits","81:8"],["onb-03-profileIntro","81:9"],["onb-04-transition","81:10"],["onb-05-section-about","81:11"],["onb-06-age","81:12"],["onb-07-gender","81:13"],["onb-08-chronotype","81:14"],["onb-09-goals","81:15"],["onb-10-section-sleep","81:16"],["onb-11-rating","81:17"],["onb-12-latency","81:18"],["onb-13-awaken","81:19"],["onb-14-early","81:20"],["onb-15-mind","81:21"],["onb-16-screens","81:22"],["onb-17-caffeine","81:23"],["onb-18-consistency","81:24"],["onb-19-ritual","81:25"],["onb-20-daytime","81:26"],["onb-21-calculating","81:27"],["onb-22-score","81:28"],["onb-23-analysis","81:29"],["onb-24-section-targets","81:30"],["onb-25-goal","81:31"],["onb-26-wake","81:32"],["onb-27-reminders","81:33"],["onb-28-plan","81:34"],
["auth-sign-in","81:36"],["auth-sign-up","81:37"],["auth-forgot","81:38"],["auth-reset-sent","81:39"],
["home","81:41"],
["track-mode","81:43"],["track-nap","81:44"],["track-night","81:45"],["place-device","81:46"],["tracking-active","81:47"],["tracking-stop-confirm","81:48"],
["sounds","81:50"],["sounds-full","81:51"],["sounds-player","81:52"],["sounds-player-full","81:53"],
["sleep-schedule","81:55"],
["wind-down","81:57"],["night-shift-guide","81:58"],["routine","81:59"],["routine-full","81:60"],
["practice-intro","81:62"],["practice-session","81:63"],["practice-complete","81:64"],
["course","81:66"],["course-full","81:67"],["lesson","81:68"],
["journal","81:70"],["journal-full","81:71"],["journal-entry","81:72"],["wakeup-survey","81:73"],
["quiz-intro","81:75"],["quiz-session","81:76"],["quiz-result","81:77"],
["profile","81:79"],["profile-full","81:80"],["subscription","81:81"],["subscription-full","81:82"],
["mood-showcase","81:84"],
];
const pairs = map.map(([png, nodeId]) => {
  const buf = readFileSync(`${DIR}/${png}.png`);
  const hash = createHash('sha1').update(buf).digest('hex');
  return [nodeId, hash];
});
console.log(JSON.stringify(pairs));
console.error('pairs:', pairs.length);
