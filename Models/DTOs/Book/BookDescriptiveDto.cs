using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Author;
using MilLib.Models.DTOs.Tag;

namespace api.Models.DTOs.Book
{
    public class BookDescriptiveDto
    {
        public int Id {get; set;}
        public required string Title {get; set;}
        public List<AuthorSimpleDto> Authors {get; set;} = new List<AuthorSimpleDto>();
        public string? Info {get; set;}
        public int? LikesCount {get; set;}
        public List<TagSimpleDto> Tags {get; set;} = new List<TagSimpleDto>();
    }
}