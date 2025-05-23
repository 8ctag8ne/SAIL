using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Helpers
{
    public class BookQueryObject
    {
        //filtering
        public string? Title { get; set; } = null;
        public int? AuthorId { get; set; } = null;
        public List<int> TagIds { get; set; } = new List<int>();

        //sorting
        public bool IsDescenging { get; set; } = false;
        public string? SortBy { get; set; } =  null;

        //pagination
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}