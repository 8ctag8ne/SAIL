using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.Entities;

namespace MilLib.Models.DTOs.Tag
{
    public class TagDto
    {
        public int Id {get; set;}
        public string? Title {get; set;}
        public string? Info {get; set;}
        public string? ImageUrl {get; set;}
        public List<BookTag> Books {get; set;} = new List<BookTag>();
    }
}