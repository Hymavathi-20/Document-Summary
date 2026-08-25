document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const generateBtn = document.getElementById('generateBtn');
  const progressCard = document.getElementById('progressCard');
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressStatus = document.getElementById('progressStatus');
  const resultsGrid = document.getElementById('resultsGrid');
  const overviewText = document.getElementById('overviewText');
  const keyPointsList = document.getElementById('keyPointsList');
  const readingTimeSaved = document.getElementById('readingTimeSaved');

  // In-memory state
  let currentExtractedText = '';

  // File Upload Triggers
  dropzone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });
  browseBtn.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, () => dropzone.classList.add('drag-over'));
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, () => dropzone.classList.remove('drag-over'));
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  // Extract text on upload, but do NOT summarize yet
  async function handleFile(file) {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid PDF or PNG/JPG image file.');
      return;
    }

    resultsGrid.style.display = 'none';
    generateBtn.style.display = 'none';
    progressCard.style.display = 'block';
    updateProgress(10, 'Reading file...');

    try {
      if (file.type === 'application/pdf') {
        updateProgress(40, 'Extracting text from PDF...');
        currentExtractedText = await extractPdfText(file);
      } else {
        updateProgress(40, 'Running OCR on image...');
        currentExtractedText = await extractImageText(file);
      }

      updateProgress(100, 'Text extracted successfully!');
      setTimeout(() => {
        progressCard.style.display = 'none';
        generateBtn.style.display = 'inline-block'; // Reveal Generate button
      }, 300);

    } catch (err) {
      console.error(err);
      progressCard.style.display = 'none';
      alert('Failed to extract text. Please try another file.');
    }
  }

  // Trigger Summary Generation on Button Click
  generateBtn.addEventListener('click', () => {
    if (!currentExtractedText) return;

    progressCard.style.display = 'block';
    updateProgress(50, 'Analyzing text patterns...');

    setTimeout(() => {
      const lengthOption = document.querySelector('input[name="length"]:checked').value;
      const result = summarizeText(currentExtractedText, lengthOption);

      updateProgress(100, 'Done!');
      setTimeout(() => {
        progressCard.style.display = 'none';

        overviewText.innerHTML = result.summary.map(s => `<p>${s}</p>`).join('');
        keyPointsList.innerHTML = result.keyPoints.map(k => `<li>${k}</li>`).join('');

        const minutesSaved = Math.max(1, Math.round((result.originalWords - result.summaryWords) / 200));
        readingTimeSaved.textContent = `Saved ~${minutesSaved} min read`;

        resultsGrid.style.display = 'grid';
      }, 200);
    }, 100);
  });

  function updateProgress(percent, statusText) {
    progressFill.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
    progressStatus.textContent = statusText;
  }

  async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + ' ';
    }
    return text;
  }

  async function extractImageText(file) {
    const worker = await Tesseract.createWorker('eng');
    const ret = await worker.recognize(file);
    await worker.terminate();
    return ret.data.text;
  }

  function summarizeText(rawText, lengthOption) {
    let cleanText = rawText
      .replace(/([a-z])([A-Z])/g, '$1. $2')
      .replace(/\s+/g, ' ')
      .trim();

    const rawSentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];

    const validSentences = rawSentences
      .map(s => s.trim())
      .filter(s => {
        const words = s.split(/\s+/).length;
        return words >= 8 && words <= 35 && /[.!?]$/.test(s);
      });

    if (validSentences.length === 0) {
      return {
        summary: ["Could not extract sufficient prose from the document."],
        keyPoints: ["Ensure the uploaded file contains clear, standard text paragraphs."],
        originalWords: 0,
        summaryWords: 0
      };
    }

    const stopWords = new Set(['the','is','at','which','on','and','a','an','in','that','have','for','it','with','as','was','of','or','by','to','this','be']);
    const wordFreq = {};

    validSentences.forEach(s => {
      const words = s.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      words.forEach(w => { if (!stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; });
    });

    const scored = validSentences.map((sentence, index) => {
      const words = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      let score = 0;
      words.forEach(w => { if (wordFreq[w]) score += wordFreq[w]; });
      return { sentence, score: score / Math.sqrt(words.length || 1), originalIndex: index };
    });

    const sorted = [...scored].sort((a, b) => b.score - a.score);

    let totalTarget = 4;
    if (lengthOption === 'short') totalTarget = Math.min(3, validSentences.length);
    if (lengthOption === 'medium') totalTarget = Math.min(5, validSentences.length);
    if (lengthOption === 'long') totalTarget = Math.min(7, validSentences.length);

    const overviewCount = Math.max(1, Math.floor(totalTarget / 2));

    const overviewPicks = sorted.slice(0, overviewCount)
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map(i => i.sentence);

    const takeawayPicks = sorted.slice(overviewCount, totalTarget)
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map(i => i.sentence);

    return {
      summary: overviewPicks,
      keyPoints: takeawayPicks.length > 0 ? takeawayPicks : overviewPicks,
      originalWords: rawText.split(/\s+/).length,
      summaryWords: (overviewPicks.join(' ') + takeawayPicks.join(' ')).split(/\s+/).length
    };
  }
});