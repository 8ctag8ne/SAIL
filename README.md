# 📚 SAIL – Smart AI-integrated Library

A web application for managing an online library with **automated metadata generation** and **personalized reading list recommendations** powered by the **Gemini large language model (LLM)**.

> 🚀 Created as a course project for the 3rd year of the "Informatics" program at Taras Shevchenko National University of Kyiv.

---

## ✨ Key Features

* 🧠 **AI-powered metadata extraction** from uploaded PDF files (title, description, authors, tags).
* 📄 **PDF support** with OCR for scanned documents (Tesseract + DocNET + ImageSharp).
* 📚 **Personalized reading lists (CheatSheets)** based on user queries, generated via Google Gemini (Vertex AI).
* 🔐 **Authentication and role-based access** (`User`, `Admin`, `Librarian`) with JWT support.
* 🔍 **Advanced book filtering** by title, authors, and tags.
* 💾 **CRUD operations** for books, authors, tags, reading lists, comments, and likes.
* 🖼️ Dynamic **first-page rendering** of PDFs as book covers.

---

## 🧰 Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Backend        | ASP.NET Core Web API                         |
| Frontend       | React + TypeScript                           |
| Database       | Microsoft SQL Server + Entity Framework Core |
| PDF Handling   | DocNET, ImageSharp, Tesseract OCR            |
| AI Integration | Google Vertex AI (Gemini 2.5 Pro)            |
| Auth           | JWT + ASP.NET Identity                       |
| Deployment     | Localhost / IIS / Docker-ready (optional)    |

---

## 🚀 Getting Started

### Prerequisites

* .NET 8 SDK
* Node.js + npm
* SQL Server (local or remote)
* Vertex AI API key (or service account)
* Tesseract OCR installed locally

### Backend

```bash
cd api/
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend

```bash
cd frontend/
npm install
npm start
```

---

## 📦 API Overview

Sample endpoints:

* `POST /api/pdf/analyze-book` – generate book metadata from uploaded PDF
* `POST /api/pdf/search-by-request` – create CheatSheet from user query
* `GET /api/book` – list all books
* `POST /api/booklist/add-book` – add book to reading list
* `POST /api/account/login` – JWT authentication

See full API documentation in the `/docs/` folder *(to be added)*.

---

<!-- ## 📸 Screenshots

> *(Insert here if needed: search page, book details, read-list generator, admin dashboard...)*

--- -->

## 🙏 Acknowledgments

This project was supervised by [Anton S. Svystunov](https://www.linkedin.com/in/anton-svystunov/), assistant at the Department of Theory and Programming Technologies, Faculty of Computer Science and Cybernetics, Taras Shevchenko National University of Kyiv.

---

## 💡 Future Improvements

* 🔍 Better search ranking and semantic tagging
* 🌐 Multi-language support (Ukrainian, English)
* ☁️ Cloud deployment (Azure, Vercel)

---

## 📬 Feedback

Pull requests and feature suggestions are very welcome. If you have ideas, improvements, or just want to say hi — feel free to open an issue or reach out.

---

## 📎 Repository

[🔗 https://github.com/8ctag8ne/SAIL](https://github.com/8ctag8ne/SAIL)

