using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Book
{
    public class BookUpdateDto
    {
        public string? Title {get; set;}
        public int AuthorId {get; set;}
        public IFormFile? File {get; set;}
        public IFormFile? Image {get; set;}
        public string? Info {get; set;}
        public List<int> TagIds {get; set;} = new List<int>();
    }
}