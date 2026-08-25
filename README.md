# Document Summary Assistant

Document Summary Assistant is a lightweight browser-based web application that extracts text from PDFs and images to generate structured overview summaries and key points.

🔗 **Live Demo:** [document-summariser.netlify.app](https://document-summarizer-assisstant.netlify.app/)

---

## 💡 What it does

Upload a PDF or an image of a document to extract text instantly and receive:

* **Structured Overview**: A concise synthesis of the document's core content.
* **Actionable Key Takeaways**: Bulleted highlights of critical points.
* **Custom Control**: Manual summary generation across customizable length thresholds.
* **Efficiency Metric**: Real-time estimation of reading time saved.

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **PDF Extraction** | Extracts raw text directly from multi-page PDF files |
| **Image Extraction** | Extracts text from standard image formats (`.jpg`, `.png`) |
| **In-Browser OCR** | Powered by Tesseract.js v5 for client-side Optical Character Recognition |
| **NLP Summarization** | Extractive scoring algorithm using Term Frequency (TF) normalized by length |
| **Length Controls** | Granular summary targets: Short (~25%), Medium (~40%), and Long (~60%) |
| **Key Points** | Formats main takeaways as concise, scannable bullet points |
| **Manual Trigger** | Dedicated action button for full generation control |
| **Time Saved Metric** | Estimates and displays overall reading time saved |
| **Drag & Drop** | Native HTML drag-and-drop file upload zone |
| **Privacy First** | 100% client-side processing — zero server uploads or external API calls |

---

## 🛠️ Technologies Used

| Layer | Technology / Library | Usage |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | UI layout, CSS Grid/Flexbox dark theme, DOM manipulation |
| **PDF Processing** | PDF.js | Client-side text stream parsing |
| **OCR Processing** | Tesseract.js | In-browser image text extraction via Web Workers |
| **Deployment** | Netlify | Static web hosting and continuous deployment |

---

## ⚙️ How It Works

```text
 ┌──────────────┐     ┌───────────────────────┐     ┌────────────────────────┐     ┌────────────────┐
 │ Upload File  │ ──> │    Text Extraction    │ ──> │ TF Sentence Scoring    │ ──> │ Render Results │
 │ (PDF / Image)│     │ (PDF.js / Tesseract)  │     │ (Normalized by √L)     │     │ & Time Saved   │
 └──────────────┘     └───────────────────────┘     └────────────────────────┘     └────────────────┘
```

### ⚙️ How It Works

1. **Upload**: Drop or select a PDF or image inside the file dropzone.
2. **Text Extraction**:
   * **PDFs**: Parsed via **PDF.js** to stream raw text items across pages.
   * **Images**: Processed via **Tesseract.js** in a dedicated Web Worker thread.
3. **Configuration**: Choose target summary density (Short, Medium, or Long).
4. **Sentence Scoring Algorithm**:
   * Text is cleaned of orphan headers and split into discrete sentence tokens.
   * Sentences are evaluated using Term Frequency (TF) scoring normalized by length ($\sqrt{L}$) to prevent bias toward longer sentences.
   * Top-ranked sentences are chronologically sorted to preserve contextual narrative flow.
5. **Output**: Formatted overview paragraphs, key bullet points, and estimated time saved are dynamically rendered.

---

### 📊 Summary Options

| Option | Summary Target | Best Used For |
| :--- | :--- | :--- |
| **Short** | ~25% of document sentences | Quick executive summaries and quick scanning |
| **Medium** | ~40% of document sentences | Balanced overview of key concepts and arguments |
| **Long** | ~60% of document sentences | Comprehensive detailed breakdown of complex files |

---

### 🔒 Privacy & Security

* **Zero Data Transmission**: Text parsing, OCR operations, and NLP sentence scoring run entirely inside your browser instance.
* **No Server Footprint**: No external APIs or server storage are used — your files never leave your device.

---

### 📁 Project Structure

```text
document-summary-assistant/
├── index.html       # Application markup and UI layout
├── styles.css       # Dark theme styles, responsive layouts, and animations
├── script.js        # OCR, PDF parsing, and NLP summarization logic
└── README.md        # Project documentation
```

## 💻 Local Development

No Node.js dependencies, complex setup, or build tools required.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/document-summary-assistant.git](https://github.com/your-username/document-summary-assistant.git)
   cd document-summary-assistant
   ```
   ## 💻 Run the Application

* **Option A:** Open `index.html` directly in any modern web browser.
* **Option B:** Serve locally via Python:

```bash
python3 -m http.server 8000
```

Navigate to `http://localhost:8000` in your browser.

---

## 🚀 Future Roadmap

- [ ] **Hybrid AI Summarization**: Add optional LLM integrations (or WebGPU-based models like WebLLM) for abstractive summarization.
- [ ] **Expanded File Support**: Parse Microsoft Word (`.docx`) and plain text (`.txt`) files client-side.
- [ ] **Batch Processing**: Upload and summarize multiple documents simultaneously with comparative insights.
- [ ] **Export Capabilities**: Export generated summaries directly to `.md` or `.pdf` formats.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
