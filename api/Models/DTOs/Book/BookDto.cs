using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.Entities;
using MilLib.Models.DTOs.Comment;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.DTOs.Author;

namespace MilLib.Models.DTOs.Book
{
    public class BookDto
    {
        public int Id {get; set;}
        public required string Title {get; set;}
        public List<AuthorSimpleDto> Authors {get; set;} = new List<AuthorSimpleDto>();
        public string? FileUrl {get; set;}
        public string? ImageUrl {get; set;}
        public string? Info {get; set;}
        public int? LikesCount {get; set;}
        public bool IsLiked {get; set;} = false;
        public List<TagSimpleDto> Tags {get; set;} = new List<TagSimpleDto>();
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
    }
}