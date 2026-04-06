//api/Controllers/PdfController.cs
using api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilLib.Models.DTOs.Pdf;
using MilLib.Services.Interfaces;
using SixLabors.ImageSharp.Formats.Png;

namespace MilLib.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PdfController : ControllerBase
    {
        private readonly IPdfRenderService _pdfRenderService;

        public PdfController(IPdfRenderService pdfRenderService, IAuthorService authorService, ITagService tagService)
        {
            _pdfRenderService = pdfRenderService;
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
