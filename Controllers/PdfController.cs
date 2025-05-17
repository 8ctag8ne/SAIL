using System.Text.RegularExpressions;
using api.Models.DTOs.PDFFile;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilLib.Models.DTOs.Pdf;
using MilLib.Services.Implementations;
using MilLib.Services.Interfaces;
using SixLabors.ImageSharp.Formats.Png;

namespace MilLib.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        private readonly IPdfRenderService _pdfRenderService;
        private readonly IOcrService _ocrService;

        private readonly IPdfTextExtractorService _pdfTextExtractor;

        public PdfController(IPdfRenderService pdfRenderService, IOcrService ocrService, IPdfTextExtractorService pdfTextExtractor)
        {
            _ocrService = ocrService;
            _pdfRenderService = pdfRenderService;
            _pdfTextExtractor = pdfTextExtractor;
        }

        [HttpPost("render-first-page")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> RenderFirstPage([FromForm] PdfFileDto pdfFile)
        {
            var file = pdfFile.File;
            if (file == null || file.Length == 0)
                return BadRequest("PDF file is required.");

            // Зчитуємо весь PDF у пам'ять один раз
            using var pdfStream = file.OpenReadStream();
            var pdfBytes = await ReadAllBytesAsync(pdfStream);

            try
            {
                // Рендеримо першу сторінку з DPI 50
                using var image = await _pdfRenderService.RenderPageAsync(pdfBytes, 0, 50);
                
                // Конвертуємо у PNG
                using var ms = new MemoryStream();
                await image.SaveAsync(ms, new PngEncoder());
                
                return File(ms.ToArray(), "image/png");
            }
            catch (ArgumentOutOfRangeException ex)
            {
                return BadRequest("Invalid page number");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error processing PDF");
            }
        }

        private async Task<byte[]> ReadAllBytesAsync(Stream stream)
        {
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms);
            return ms.ToArray();
        }

        [HttpPost("ocr")]
        public async Task<IActionResult> ExtractText([FromForm] OcrRequestDto dto)
        {
            try
            {
                var file = dto.PdfFile;
                if (file == null || file.Length == 0)
                    return BadRequest("PDF file is required.");

                // // Читання PDF
                using var stream = file.OpenReadStream();
                var pdfBytes = await ReadAllBytesAsync(stream);

                // Спроба витягти текст через PDF Text Extractor
                var pdfText = _pdfTextExtractor.ExtractText(pdfBytes, dto.PageCount);
                if (IsTextValid(pdfText))
                    return Ok(pdfText);

                // // Якщо текст невалідний — використовуємо OCR з DPI=300
                using var ocrStream = file.OpenReadStream();
                var ocrText = await _ocrService.ExtractTextAsync(ocrStream, dto.PageCount);
                return Ok(ocrText);
            }
            catch (Exception ex)
            {
                Console.WriteLine("OCR processing failed: " + ex.Message);
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        private bool IsTextValid(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;

            // Приклад перевірки: мінімум 50 слів довжиною від 3 літер
            var wordMatches = Regex.Matches(text, @"\b\w{3,}\b");
            return wordMatches.Count >= 50;
        }
    }
}
