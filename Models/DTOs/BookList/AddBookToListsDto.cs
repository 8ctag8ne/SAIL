using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;

namespace MilLib.Models.DTOs.BookList
{
    public class AddBookToListsDto
    {
        public int BookId { get; set; }
        public List<int> BookListIds { get; set; } = new();
    }
}