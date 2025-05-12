using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;

namespace MilLib.Models.DTOs.BookList
{
    public class BookListDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public string? Description { get; set; }
        public bool? IsPrivate {get; set;}
        public List<BookSimpleDto> Books { get; set;} = new List<BookSimpleDto>();
    }
}