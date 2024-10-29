using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.Entities
{
    public class Author
    {
        public int Id {get; set;}
        public string? Name {get; set;}
        public string? ImageUrl {get; set;}
        public string? Info {get; set;}
        public List<Book> Books {get; set;} = new List<Book>();
    }
}