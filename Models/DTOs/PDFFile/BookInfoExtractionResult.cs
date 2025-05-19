using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.DTOs.PDFFile
{
    public class BookInfoExtractionResult
    {
        public string? Title { get; set; }
        public string? Author { get; set; }
        public string? Description { get; set; }
        public List<string> ExistingTags { get; set; } = [];
        public List<string> SuggestedTags { get; set; } = [];
    }
}