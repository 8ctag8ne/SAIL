using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.BookList
{
    public class BookListSimpleDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public bool? IsPrivate {get; set;}
    }
}