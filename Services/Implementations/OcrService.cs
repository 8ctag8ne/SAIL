// OcrService.cs
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using Tesseract;
using Docnet.Core;
using Docnet.Core.Models;
using Docnet.Core.Readers;
using System.IO;
using System.Text;
using System;
using api.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class OcrService : IOcrService, IDisposable
    {
        private readonly IPdfRenderService _pdfRenderService;
        private readonly TesseractEngine _engine;
        private bool _disposed;

        public OcrService(IPdfRenderService pdfRenderService)
        {
            _pdfRenderService = pdfRenderService;
            _engine = new TesseractEngine(
                Path.Combine(AppContext.BaseDirectory, "tessdata"),
                "ukr+eng",
                EngineMode.LstmOnly
            );
            _engine.DefaultPageSegMode = PageSegMode.Auto;
            _disposed = false;
        }

        public void Dispose()
        {
            if (_disposed)
                return;
            _engine?.Dispose();
            _disposed = true;
        }

        public async Task<string> ExtractTextAsync(Stream pdfStream, int pageCount)
        {
            var pdfBytes = await ReadAllBytesAsync(pdfStream);
            using var docReader = DocLib.Instance.GetDocReader(pdfBytes, new PageDimensions(1, 1));

            pageCount = Math.Min(pageCount, docReader.GetPageCount());
            var result = new StringBuilder();

            for (int i = 0; i < pageCount; i++)
            {
                using var image = await _pdfRenderService.RenderPageAsync(pdfBytes, i, 200);
                using var pix = ConvertToPix(image);
                using var page = _engine.Process(pix);
                result.AppendLine(page.GetText());
            }

            return result.ToString();
        }

        private Pix ConvertToPix(Image<Rgba32> image)
        {
            image.Mutate(x => x
                .Grayscale()
                .Contrast(0.5f));

            using var memoryStream = new MemoryStream();
            image.SaveAsPng(memoryStream);
            memoryStream.Position = 0;

            return Pix.LoadFromMemory(memoryStream.ToArray());
        }

        private async Task<byte[]> ReadAllBytesAsync(Stream stream)
        {
            if (stream is MemoryStream ms)
                return ms.ToArray();

            var newMs = new MemoryStream();
            await stream.CopyToAsync(newMs);
            return newMs.ToArray();
        }
    }
}