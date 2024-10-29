using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.Entities
{
    public class Tag
    {
        public int Id {get; set;}
        public string? Title {get; set;}
        public string? Info {get; set;}
        public string? ImageUrl {get; set;}
        public List<BookTag> Books {get; set;} = new List<BookTag>();
    }
}