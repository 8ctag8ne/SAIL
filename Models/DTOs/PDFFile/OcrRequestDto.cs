using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.DTOs.PDFFile
{
    public class OcrRequestDto
    {
        required public IFormFile PdfFile { get; set; }
        public int PageCount { get; set; } = 10;
    }
}