using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Book
{
    public class BookUpdateDto
    {
        public string? Title {get; set;}
        public IFormFile? File {get; set;}
        public IFormFile? Image {get; set;}
        public string? Info {get; set;}
        // public int? LikesCount {get; set;}
        public List<int>? TagIds {get; set;}
        public List<int>? AuthorIds {get; set;}
        public List<string> NewTagTitles {get; set;} = new List<string>();
    }
}