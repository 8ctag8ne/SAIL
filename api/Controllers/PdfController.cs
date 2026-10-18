//api/Controllers/PdfController.cs
using api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilLib.Models.DTOs.Pdf;
using MilLib.Services.Interfaces;
using SixLabors.ImageSharp.Formats.Webp;

namespace MilLib.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        private readonly IPdfRenderService _pdfRenderService;
        private readonly IBookService _bookService;

        public PdfController(IPdfRenderService pdfRenderService, IBookService bookService)
        {
            _pdfRenderService = pdfRenderService;
            _bookService = bookService;
        }

        [HttpPost("render-book-cover/{bookId}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> RenderBookCover(int bookId)
        {
            try
            {
                var fileResponse = await _bookService.GetBookFileAsync(bookId);
                using var ms = new MemoryStream();
                await fileResponse.Content.CopyToAsync(ms);
                var pdfBytes = ms.ToArray();

                using var image = await _pdfRenderService.RenderPageAsync(pdfBytes, 0, 50);

                using var outMs = new MemoryStream();
                await image.SaveAsync(outMs, new WebpEncoder { Quality = 80 });

                return File(outMs.ToArray(), "image/webp");
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error processing PDF: {ex.Message}");
            }
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

                // Конвертуємо у WebP (Quality = 80 значно зменшує розмір без втрати читабельності)
                using var ms = new MemoryStream();
                await image.SaveAsync(ms, new WebpEncoder { Quality = 80 });

                return File(ms.ToArray(), "image/webp");
            }
            catch (ArgumentOutOfRangeException)
            {
                return BadRequest("Invalid page number");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error processing PDF: {ex.Message}");
            }
        }

        private async Task<byte[]> ReadAllBytesAsync(Stream stream)
        {
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms);
            return ms.ToArray();
        }
    }
}
