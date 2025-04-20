using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.Entities;
using MilLib.Models.DTOs.Comment;

namespace MilLib.Models.DTOs.Book
{
    public class BookDto
    {
        public int Id {get; set;}
        public required string Title {get; set;}
        public int AuthorId {get; set;}
        public string? FileUrl {get; set;}
        public string? ImageUrl {get; set;}
        public string? Info {get; set;}
        public List<BookTag> Tags {get; set;} = new List<BookTag>();
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
    }
}