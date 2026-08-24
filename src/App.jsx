import React, { useState } from 'react';
import { extractTextFromPDF, extractTextFromImage } from './utils/parser';
import { summarizeText } from './utils/summarizer';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const processDocument = async () => {
    if (!file) {
      setError('Please select or drop a file first.');
      return;
    }

    setLoading(true);
    setProgress(10);
    setError('');
    setSummaryData(null);

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        setStatusText('Parsing PDF text content...');
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        setStatusText('Running OCR on image...');
        extractedText = await extractTextFromImage(file, (p) => setProgress(p));
      } else {
        throw new Error('Unsupported file format. Please upload a PDF or an Image.');
      }

      if (!extractedText.trim()) {
        throw new Error('No readable text could be extracted from this file.');
      }

      setStatusText('Generating smart summary...');
      setProgress(90);
      
      const result = await summarizeText(extractedText, summaryLength);
      setSummaryData(result);
      setProgress(100);
    } catch (err) {
      setError(err.message || 'An error occurred during processing.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Document Summary Assistant</h1>
        <p>Upload a PDF or Image to extract text and generate key takeaways instantly.</p>
      </header>

      <main className="main-content">
        {/* File Dropzone */}
        <div 
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="fileInput" 
            accept="application/pdf,image/*" 
            onChange={handleFileChange} 
            hidden 
          />
          <label htmlFor="fileInput" className="dropzone-label">
            {file ? (
              <p className="file-selected">Selected File: <strong>{file.name}</strong></p>
            ) : (
              <p>Drag & drop your <strong>PDF</strong> or <strong>Image</strong> here, or <span className="browse-text">Browse</span></p>
            )}
          </label>
        </div>

        {/* Controls */}
        <div className="controls-row">
          <div className="length-selector">
            <label>Summary Length:</label>
            <select 
              value={summaryLength} 
              onChange={(e) => setSummaryLength(e.target.value)}
              disabled={loading}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <button 
            className="process-btn" 
            onClick={processDocument} 
            disabled={loading || !file}
          >
            {loading ? 'Processing...' : 'Summarize Document'}
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="error-banner">{error}</div>}

        {/* Progress bar */}
        {loading && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <p className="status-text">{statusText} ({progress}%)</p>
          </div>
        )}

        {/* Output Section */}
        {summaryData && (
          <div className="results-container">
            <h2>Summary Output</h2>
            
            <div className="summary-section">
              <h3>Overview</h3>
              <p>{summaryData.summary}</p>
            </div>

            <div className="keypoints-section">
              <h3>Key Takeaways</h3>
              <ul>
                {summaryData.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="meta-info">
              <span>Word Count: <strong>{summaryData.wordCount}</strong></span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;