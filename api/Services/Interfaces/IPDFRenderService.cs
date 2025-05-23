using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Docnet.Core.Models;
using Docnet.Core.Readers;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace api.Services.Interfaces
{
    public interface IPdfRenderService
    {
        Task<Image<Rgba32>> RenderFirstPageAsync(byte[] pdfBytes);
        Task<Image<Rgba32>> RenderPageAsync(byte[] pdfBytes, int pageNumber, int dpi = 300);
        // Task<Image<Rgba32>> RenderPageAsync(IDocReader docReader, int pageNumber, PageDimensions dimensions, int dpi);
    }
}