using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Comment
{
    public class CommentCreateDto
    {
        public int BookId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? Content { get; set; }
        public int? ReplyToId {get; set;}
    }
}