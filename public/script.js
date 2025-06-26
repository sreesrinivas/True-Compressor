const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('files');
const form = document.getElementById('uploadForm');
const results = document.getElementById('results');
const fileListBox = document.getElementById('fileListBox');
const fileListWrapper = document.getElementById('fileList');

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
  selectedFiles = [...e.dataTransfer.files];
  displaySelectedFiles();
});

fileInput.addEventListener('change', () => {
  selectedFiles = [...fileInput.files];
  displaySelectedFiles();
});

function displaySelectedFiles() {
  fileListBox.innerHTML = '';
  fileListWrapper.classList.remove('hidden');

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item flex justify-between items-center bg-gray-100 rounded-xl px-4 py-3';

    item.innerHTML = `
      <div>
        <strong>${index + 1}.</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)
      </div>
      <button class="btn-remove" onclick="removeFile(${index})">Remove</button>
    `;

    fileListBox.appendChild(item);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  fileInput.value = '';
  displaySelectedFiles();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedFiles.length) {
    alert("Please select or drop at least one file.");
    return;
  }

  const formData = new FormData();
  selectedFiles.forEach(file => formData.append('files', file));

  results.innerHTML = '';

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    results.innerHTML = '';

    data.files.forEach((file, index) => {
      const fileBox = document.createElement('div');
      fileBox.className = 'bg-white p-5 rounded-2xl shadow border animate-fade-in-up';

      const blob = base64ToBlob(file.base64, file.mimeType);
      const url = URL.createObjectURL(blob);

      fileBox.innerHTML = `
        <p><strong>${index + 1}.</strong> <strong class="text-gray-700">Original:</strong> ${file.originalName} (${(file.originalSize / 1024).toFixed(2)} KB)</p>
        <p><strong class="text-gray-700">Compressed:</strong> ${file.downloadName} (${(file.compressedSize / 1024).toFixed(2)} KB)</p>
        <div class="flex items-center gap-2 mt-2">
          <input type="text" value="${file.downloadName}" class="renameInput p-2 border rounded w-72" />
          <span title="Edit filename" class="text-gray-500 text-xl">✏️</span>
        </div>
        <a class="btn-download block mt-3 px-4 py-2 rounded-lg" download>
          Download
        </a>
      `;

      const renameInput = fileBox.querySelector('.renameInput');
      const downloadBtn = fileBox.querySelector('.btn-download');

      renameInput.addEventListener('input', () => {
        downloadBtn.setAttribute('download', renameInput.value.trim());
      });

      downloadBtn.href = url;
      downloadBtn.setAttribute('download', renameInput.value.trim());

      results.appendChild(fileBox);
    });

    selectedFiles = [];
    fileInput.value = '';
    displaySelectedFiles();
    fileListWrapper.classList.add('hidden');

  } catch (err) {
    console.error("Compression failed", err);
    results.innerHTML = '<p class="text-red-600 font-medium">Something went wrong. Please try again.</p>';
  }
});

function base64ToBlob(base64, mime) {
  const byteChars = atob(base64);
  const byteArrays = [];
  for (let i = 0; i < byteChars.length; i += 512) {
    const slice = byteChars.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mime });
}
