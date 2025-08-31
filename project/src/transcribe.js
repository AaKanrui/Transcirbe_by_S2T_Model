import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { OpenAI } from 'openai';
import { safeFilename } from './utils.js';

const ffmpegDefault = path.resolve('bin/ffmpeg/ffmpeg');
const ffmpegPath = fs.existsSync(ffmpegDefault) ? ffmpegDefault : 'ffmpeg';

export async function transcribe({ file, originalName, model, format, chunkMinutes, apiKey, job }) {
  const outputDir = path.resolve('.data/outputs');
  const chunksDir = path.resolve('.data/chunks');
  const base = safeFilename(path.parse(originalName).name);
  const outPath = path.join(outputDir, `${base}.${format}`);

  const openai = new OpenAI({ apiKey });

  job.step = 1;
  job.steps = 3;
  job.log.push('split');
  const chunkSeconds = Math.max(30, Math.min(chunkMinutes * 60, 15 * 60));
  const chunkPattern = path.join(chunksDir, `${base}-%03d.wav`);
  await runFfmpeg([ '-i', file, '-f', 'segment', '-segment_time', String(chunkSeconds), '-c', 'copy', chunkPattern ]);

  const chunkFiles = fs.readdirSync(chunksDir).filter(f => f.startsWith(base)).sort();
  job.chunks = chunkFiles.length;
  job.step = 2;
  job.log.push('transcribe');

  let text = '';
  for (let i = 0; i < chunkFiles.length; i++) {
    job.chunk = i + 1;
    const chunkPath = path.join(chunksDir, chunkFiles[i]);
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(chunkPath),
      model
    });
    text += response.text + '\n';
  }

  job.step = 3;
  job.log.push('write');
  fs.writeFileSync(outPath, text);

  fs.unlinkSync(file);
  for (const f of chunkFiles) fs.unlinkSync(path.join(chunksDir, f));

  return outPath;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, args);
    ff.on('error', reject);
    ff.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error('ffmpeg failed'));
    });
  });
}
