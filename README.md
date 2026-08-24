# 📄 Document Summarizer JS

A high-performance, 100% client-side text extraction and summarization engine built in pure JavaScript. It cleans raw document text by removing extraction noise (such as page numbers, citation IDs, OCR split-word errors, and diagram fragments) and generates natural prose overviews and key takeaways using a custom frequency-density scoring algorithm.

✨ Features

* Upload via drag-and-drop or file picker
* Works with PDFs and scanned images (PNG/JPG)
* Multi-format extraction cleanup for PDF chunk tags, arXiv IDs, and line numbers
* Advanced grammar and integrity filters to prune flowchart step labels and UI text
* Choose summary length: Short / Medium / Long
* Sentence scoring based on Term Frequency (TF) normalized by sentence length
* Redundancy elimination using Jaccard Similarity token comparison
* Loading states + progress bar during OCR
* Mobile responsive
* 100% client-side — your files never leave your device

🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML, CSS, JavaScript | Vanilla single-page app — no framework, no build step |
| **PDF Extraction** | PDF.js | Parses raw text directly out of PDF files |
| **OCR Engine** | Tesseract.js | Performs client-side OCR on scanned images |
| **Summarization Engine** | Custom JavaScript Algorithm | Sanitizes text, filters sentence candidates, scores word density, and surfaces key points |
| **Hosting** | Netlify | Free static application hosting |

🧠 My Approach

I built this as a single-page, fully client-side app — fast to build, free to host, and simple to use.

1. **Extract raw text** — PDFs are parsed with PDF.js while scanned images run through Tesseract.js in the browser.
2. **Sanitize & validate sentences** — Cleans OCR split words, strips citation IDs, and runs regex/POS checks to prune diagram labels and non-prose headers.
3. **Score by density** — Calculates Term Frequency (TF) for key content words and scores each valid sentence normalized by sentence length ($\sqrt{L}$).
4. **Generate overview** — Selects top-scoring sentences in chronological order while applying Jaccard Similarity to eliminate duplicate points.
5. **Surface key points** — Pulls distinct standalone takeaways from the remaining scored sentence pool.

This approach skips paid AI APIs entirely, so there is no backend needed and no running cost — while producing clean, noise-free summaries directly from the source text.

💻 Run It Locally

No installation needed:
1. Clone or download this repository.
2. Open `index.html` directly in any web browser (or serve locally using VS Code Live Server).

That's it — everything runs client-side.

🚀 What I'd Add Next

* Integrate dynamic TF-IDF scoring across multi-page document chunks
* Offload heavy text processing to Web Workers to prevent UI freezing on large files
* Support for `.docx` and `.txt` file formats
* Downloadable summaries in PDF and Markdown format
* Optional local LLM integration via WebGPU / Chrome Built-in AI for generative rephrasing
