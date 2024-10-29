using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;
namespace MilLib.Models.DTOs.Author
{
    public class AuthorDto
    {
        public int Id {get; set;}
        public string? Name {get; set;}
        public string? ImageUrl {get; set;}
        public string? Info {get; set;}
        public List<BookDto> Books {get; set;} = new List<BookDto>();
    }
}