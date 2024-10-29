using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Book
{
    public class BookSimpleDto
    {
        public int Id {get; set;}
        public required string Title {get; set;}
        public string? ImageUrl {get; set;}
    }
}