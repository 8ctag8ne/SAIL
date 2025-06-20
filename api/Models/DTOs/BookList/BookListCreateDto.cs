using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.BookList
{
    public class BookListCreateDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool? IsPrivate {get; set;}
        public List<int> BookIds { get; set;} = new List<int>();
    }
}