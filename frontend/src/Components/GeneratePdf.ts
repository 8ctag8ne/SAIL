import jsPDF from "jspdf";
import { CheatSheet } from "../types";

// Шляхи до шрифтів у папці public/fonts
const robotoRegular = "/fonts/Roboto-Regular.ttf";
const robotoBold = "/fonts/Roboto-Bold.ttf";
const robotoItalic = "/fonts/Roboto-Italic.ttf";

export const generatePDF = (cheatSheet: CheatSheet) => {
  const doc = new jsPDF();

  // Додаємо шрифти
  doc.addFont(robotoRegular, "Roboto", "normal");
  doc.addFont(robotoBold, "Roboto", "bold");
  doc.addFont(robotoItalic, "Roboto", "italic");

  let y = 10; // Початкова позиція по осі Y
  const maxWidth = 180; // Максимальна ширина тексту (A4 ≈ 210 мм - відступи)

  // Заголовок (товстий шрифт)
  doc.setFont("Roboto", "bold");
  doc.setFontSize(18);
  doc.text("CheatSheet", 10, y);
  y += 10;

  // Поради
  if (cheatSheet.tips.length > 0) {
    doc.setFont("Roboto", "bold"); // Товстий для заголовка
    doc.setFontSize(14);
    doc.text("Поради:", 10, y);
    y += 10;
    doc.setFont("Roboto", "normal"); // Звичайний для тексту
    doc.setFontSize(12);
    cheatSheet.tips.forEach((tip) => {
      const lines = doc.splitTextToSize(`- ${tip}`, maxWidth);
      doc.text(lines, 10, y);
      y += lines.length * 7;
    });
    y += 10;
  }

  // Теги з посиланнями
  if (cheatSheet.tags.length > 0) {
    doc.setFont("Roboto", "bold"); // Товстий для заголовка
    doc.setFontSize(14);
    doc.text("Теги:", 10, y);
    y += 10;
    doc.setFont("Roboto", "italic"); // Нахилений для тегів
    doc.setFontSize(12);
    cheatSheet.tags.forEach((tag) => {
      const tagText = `- ${tag.title}`;
      const tagUrl = `http://localhost:3000/tags/${tag.id}`;
      const lines = doc.splitTextToSize(tagText, maxWidth);
      lines.forEach((line: string, index: number) => {
        doc.textWithLink(line, 10, y + index * 7, { url: tagUrl });
      });
      y += lines.length * 7;
    });
    y += 10;
  }

  // Книги з посиланнями
  if (cheatSheet.books.length > 0) {
    doc.setFont("Roboto", "bold"); // Товстий для заголовка
    doc.setFontSize(14);
    doc.text("Книги:", 10, y);
    y += 10;
    doc.setFontSize(12);
    cheatSheet.books.forEach((book) => {
      const authors = book.authors.map((a) => a.name).join(", ");
      
      // Назва книги (нахилений шрифт, посилання)
      doc.setFont("Roboto", "italic");
      const bookUrl = `http://localhost:3000/books/${book.id}`;
      const titleText = `Назва: ${book.title}`;
      const titleLines = doc.splitTextToSize(titleText, maxWidth);
      titleLines.forEach((line: string, index: number) => {
        doc.textWithLink(line, 10, y + index * 7, { url: bookUrl });
      });
      y += titleLines.length * 7;

      // Автори (звичайний шрифт, посилання)
      doc.setFont("Roboto", "normal");
      const authorLines = doc.splitTextToSize(`Автори: ${authors}`, maxWidth);
      const authorUrls = book.authors.map((a) => `http://localhost:3000/authors/${a.id}`);
      authorLines.forEach((line: string, index: number) => {
        // Для простоти додаємо одне посилання для всіх авторів (перший автор)
        if (index === 0 && authorUrls[0]) {
          doc.textWithLink(line, 10, y + index * 7, { url: authorUrls[0] });
        } else {
          doc.text(line, 10, y + index * 7);
        }
      });
      y += authorLines.length * 7 + 10;
    });
  }

  doc.save("cheatsheet.pdf");
};