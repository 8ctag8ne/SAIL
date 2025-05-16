using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Services.Interfaces
{
    public interface IOcrService
    {
        Task<string> ExtractTextAsync(Stream pdfStream, int pageCount);
    }
}