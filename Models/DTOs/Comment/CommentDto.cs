using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Comment
{
    public class CommentDto
    {
        public int Id { get; set; }
        // public string? CreatedBy { get; set; }
        // public User User {get; set;}
        public int BookId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? Content { get; set; }
        public int? ReplyToId {get; set;}
        public List<CommentSimpleDto> Replies { get; set; } = new List<CommentSimpleDto>();
    }
}