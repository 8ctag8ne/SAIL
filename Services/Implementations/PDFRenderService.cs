using api.Services.Interfaces;
using Docnet.Core;
using Docnet.Core.Models;
using Docnet.Core.Readers;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace MilLib.Services.Implementations;
public class PdfRenderService : IPdfRenderService
{
    public Task<Image<Rgba32>> RenderFirstPageAsync(byte[] pdfBytes)
    {
        return RenderPageAsync(pdfBytes, 0);
    }

    public Task<Image<Rgba32>> RenderPageAsync(byte[] pdfBytes, int pageNumber, int dpi = 300)
    {
        var dimensions = new PageDimensions(
            (int)(8.27 * dpi),  // A4 width in inches
            (int)(11.69 * dpi)   // A4 height in inches
        );

        using var docReader = DocLib.Instance.GetDocReader(pdfBytes, dimensions);
        
        if (pageNumber < 0 || pageNumber >= docReader.GetPageCount())
            throw new ArgumentOutOfRangeException(nameof(pageNumber));

        using var pageReader = docReader.GetPageReader(pageNumber);
        
        var rawBytes = pageReader.GetImage();
        var image = Image.LoadPixelData<Bgra32>(
            rawBytes, 
            pageReader.GetPageWidth(), 
            pageReader.GetPageHeight()
        );
        
        return Task.FromResult(image.CloneAs<Rgba32>());
    }

    // public async Task<Image<Rgba32>> RenderPageAsync(IDocReader docReader, int pageNumber, int dpi)
    // {
    //     var dimensions = new PageDimensions(
    //         (int)(8.27 * dpi), 
    //         (int)(11.69 * dpi)
    //     );

    //     using var pageReader = docReader.GetPageReader(pageNumber);
        
    //     var rawBytes = pageReader.GetImage();
    //     return Image.LoadPixelData<Bgra32>(
    //         rawBytes, 
    //         pageReader.GetPageWidth(), 
    //         pageReader.GetPageHeight()
    //     ).CloneAs<Rgba32>();
    // }

    private byte[] ReadAllBytes(Stream input)
    {
        using var ms = new MemoryStream();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}