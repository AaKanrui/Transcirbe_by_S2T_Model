const apiKey = document.getElementById('apiKey');
const audio = document.getElementById('audio');
const modelSel = document.getElementById('model');
const formatSel = document.getElementById('format');
const chunkInput = document.getElementById('chunk');
const chunkLabel = document.getElementById('chunkLabel');
const startBtn = document.getElementById('start');
const log = document.getElementById('log');
const download = document.getElementById('download');

chunkInput.addEventListener('input', () => {
  chunkLabel.textContent = chunkInput.value;
});

startBtn.addEventListener('click', async () => {
  if (!audio.files[0]) {
    alert('select audio file');
    return;
  }

  const form = new FormData();
  form.append('audio', audio.files[0]);
  form.append('model', modelSel.value);
  form.append('format', formatSel.value);
  form.append('chunkMinutes', chunkInput.value);
  form.append('apiKey', apiKey.value);
  form.append('filename', audio.files[0].name);

  const res = await fetch('/transcribe', { method: 'POST', body: form });
  const { id } = await res.json();
  log.textContent = 'Job ' + id + '\n';

  const timer = setInterval(async () => {
    const prog = await fetch('/progress/' + id).then(r => r.json());
    log.textContent = JSON.stringify(prog, null, 2);
    if (prog.status === 'done') {
      clearInterval(timer);
      download.innerHTML = `<a href="/download/${id}">Download</a>`;
    }
    if (prog.status === 'error') {
      clearInterval(timer);
      download.textContent = 'Error: ' + prog.error;
    }
  }, 1000);
});
