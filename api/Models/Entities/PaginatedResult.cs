using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.Entities
{
    public class PaginatedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
}
}