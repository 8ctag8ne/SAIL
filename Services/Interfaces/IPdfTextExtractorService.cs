using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Services.Interfaces
{
    public interface IPdfTextExtractorService
    {
        string ExtractText(byte[] pdfBytes, int maxPages);
    }
}