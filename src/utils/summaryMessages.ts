import { SpeedUnit } from './types';

export const getSummaryMessage = (dl: number | null, ul: number | null, unit: SpeedUnit): string => {
  if (dl === null) { return "Ready to see how fast this thing goes? Hit 'Test Again'!"; }
  if (dl === 0) { return "Whoa, is the internet unplugged? Like, zero speed. Check your cables!"; }
  const dlMbps = dl * (unit === 'MBps' ? 8 : 1);
  const displayDl = dl.toFixed(1);
  if (dlMbps > 200) { return `KA-CHOW! ${displayDl} ${unit} download! That's lightning fast! You're basically winning the Piston Cup of internet speeds!`; }
  else if (dlMbps > 75) { return `Niiice! ${displayDl} ${unit} download. That's super speedy! Streaming, gaming, downloading... you're all set. Go go go!`; }
  else if (dlMbps > 25) { return `Solid! ${displayDl} ${unit} down. Pretty decent speed, gets the job done for most things. Keep on truckin'!`; }
  else if (dlMbps > 5) { return `Hmm, ${displayDl} ${unit} download. A bit on the slow side. Might take a coffee break while things load? ☕`; }
  else { return `Oof! ${displayDl} ${unit} down. Are we stuck in molasses? Might be time to check if something's clogging the tubes!`; }
};
