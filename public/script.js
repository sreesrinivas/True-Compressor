const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('files');
const fileListContainer = document.getElementById('fileList');
const fileListBox = document.getElementById('fileListBox');
const results = document.getElementById('results');
const form = document.getElementById('uploadForm');

let selectedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

function handleFiles(files) {
  for (const file of files) selectedFiles.push(file);
  renderFileList();
}

function renderFileList() {
  if (selectedFiles.length === 0) {
    fileListContainer.classList.add('hidden');
    fileListBox.innerHTML = '';
    return;
  }

  fileListContainer.classList.remove('hidden');
  fileListBox.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'flex justify-between items-center';
    div.innerHTML = `
      <span>${index + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
      <button class="btn-remove" onclick="removeFile(${index})">Remove</button>
    `;
    fileListBox.appendChild(div);
  });
}

window.removeFile = function(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFiles.length) {
    alert('Please select or drag files to upload.');
    return;
  }

  const formData = new FormData();
  selectedFiles.forEach(file => formData.append('files', file));

  results.innerHTML = '<p class="text-blue-600 font-medium">Compressing files...</p>';
  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    results.innerHTML = '';
    fileListBox.innerHTML = '';
    fileListContainer.classList.add('hidden');
    selectedFiles = [];

    data.files.forEach((file, i) => {
      const fileBox = document.createElement('div');
      fileBox.className = 'bg-white p-5 rounded-2xl shadow border animate-fade-in-up';

      const renameId = `rename-${i}`;
      const downloadId = `download-${i}`;

      fileBox.innerHTML = `
        <p><strong>${i + 1}. Original:</strong> ${file.originalName} (${(file.originalSize / 1024).toFixed(2)} KB)</p>
        <p><strong>Compressed:</strong> ${(file.compressedSize / 1024).toFixed(2)} KB</p>
        <input type="text" id="${renameId}" value="${file.downloadName}" class="rename-input p-2 mt-3 border rounded w-72"/>
        <a id="${downloadId}" href="${file.downloadUrl}" download="${file.downloadName}" class="btn-download">Download</a>
      `;

      setTimeout(() => {
        const renameInput = document.getElementById(renameId);
        const downloadBtn = document.getElementById(downloadId);
        renameInput.addEventListener('input', () => {
          const newName = renameInput.value.trim();
          if (newName) downloadBtn.setAttribute('download', newName);
        });
      }, 0);

      results.appendChild(fileBox);
    });
  } catch (err) {
    console.error('Compression failed', err);
    results.innerHTML = '<p class="text-red-600">Something went wrong.</p>';
  }
});
