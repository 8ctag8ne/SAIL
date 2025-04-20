using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Helpers
{
    public class BookQueryObject
    {
        public string? Title { get; set; } = null;
        public int? AuthorId { get; set; } = null;
        public List<int> TagIds { get; set; } = new List<int>();
    }
}