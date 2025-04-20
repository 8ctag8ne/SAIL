using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.Entities
{
    public class Book
    {
        public int Id {get; set;}
        
        public required string Title {get; set;}
        public Author? Author {get; set;}
        public int AuthorId {get; set;}
        public string? FileUrl {get; set;}
        public string? ImageUrl {get; set;}
        public string? Info {get; set;}
        public List<BookTag> Tags {get; set;} = new List<BookTag>();
        public List<BookListBook> BookLists {get; set;} = new List<BookListBook>();
        public List<Comment> Comments { get; set; } = new List<Comment>();
    }
}