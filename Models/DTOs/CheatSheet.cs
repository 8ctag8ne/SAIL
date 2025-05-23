using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Book;
using MilLib.Models.DTOs.Tag;

namespace api.Models.DTOs
{
    public class CheatSheet
    {
        public List<string> Tips { get; set; } = new List<string>();
        public List<BookDto> Books { get; set; } = new List<BookDto>();
        public List<TagDto> Tags { get; set; } = new List<TagDto>();
    }
}