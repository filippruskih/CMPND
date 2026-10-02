import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpeg from "@ffmpeg-installer/ffmpeg";

const execFileAsync = promisify(execFile);

const DURATION_PATTERN = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/;

// Instagram's Graph API doesn't expose a video's own duration as a field,
// so this reads it straight from the file instead. `ffmpeg -i <url>` with
// no output errors out (expected - no output was given) but prints the
// input's stream info, including duration, to stderr before it does; it
// only needs to read the file header over the network, not the whole
// video. Returns null rather than throwing on any failure, since this is
// a nice-to-have display detail, not something sync should fail over.
export async function getVideoDurationMs(url: string): Promise<number | null> {
  try {
    await execFileAsync(ffmpeg.path, ["-i", url], { timeout: 15000 });
    return null; // ffmpeg exiting 0 with no output here would be unexpected
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    const match = stderr.match(DURATION_PATTERN);
    if (!match) return null;
    const [, hours, minutes, seconds] = match;
    const totalSeconds = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    return Math.round(totalSeconds * 1000);
  }
}
