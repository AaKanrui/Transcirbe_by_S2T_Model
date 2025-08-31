import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { transcribe } from './src/transcribe.js';

const app = express();
const upload = multer({ dest: '.data/uploads/' });
const jobs = new Map();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.post('/transcribe', upload.single('audio'), (req, res) => {
  const { model, format, chunkMinutes, apiKey, filename } = req.body;
  const id = uuidv4();
  const job = { id, status: 'processing', step: 0, steps: 3, chunk: 0, chunks: 0, log: [] };
  jobs.set(id, job);

  transcribe({
    file: req.file.path,
    originalName: filename || req.file.originalname,
    model,
    format,
    chunkMinutes: parseFloat(chunkMinutes),
    apiKey,
    job
  }).then(out => {
    job.status = 'done';
    job.output = path.basename(out);
  }).catch(err => {
    job.status = 'error';
    job.error = err.message;
  });

  res.json({ id });
});

app.get('/progress/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'not found' });
  res.json(job);
});

app.get('/download/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job || job.status !== 'done') return res.status(404).send('not ready');
  const filePath = path.join('.data/outputs', job.output);
  res.download(filePath, job.output);
});

const port = 3333;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
