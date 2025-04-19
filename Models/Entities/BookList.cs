using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.Entities
{
    public class BookList
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        // public string? CreatedBy { get; set; }
        // public User? User { get; set; }
        public string? Description { get; set; }
        public bool? IsPrivate {get; set;}
        public List<BookListBook> Books { get; set;} = new List<BookListBook>();
    }
}