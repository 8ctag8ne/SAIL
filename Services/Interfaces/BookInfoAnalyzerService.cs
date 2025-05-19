using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Author;
using MilLib.Models.DTOs.Tag;

namespace api.Services.Interfaces
{
    public interface IBookInfoAnalyzerService
    {
        Task<string> AnalyzeBookInfoAsync(string extractedText, IEnumerable<TagSimpleDto> currentTags, IEnumerable<AuthorSimpleDto> currentAuthors);
    }
}