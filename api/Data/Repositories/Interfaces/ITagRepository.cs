using System.Collections.Generic;
using System.Threading.Tasks;
using api.Models.Entities;
using MilLib.Helpers;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.Entities;

namespace MilLib.Repositories.Interfaces
{
    public interface ITagRepository
    {
        Task<IEnumerable<Tag>> GetAllWithBooksAsync();
        Task<IEnumerable<TagSimpleDto>> GetAllSimpleAsync();
        Task<Tag> GetByIdWithBooksAsync(int id);
        Task<Tag> GetByIdAsync(int id);
        Task AddAsync(Tag tag);
        Task UpdateAsync(Tag tag);
        Task DeleteAsync(Tag tag);
        Task<IEnumerable<BookTag>> GetBookTagsByTagIdAsync(int tagId);
        Task RemoveBookTagsRangeAsync(IEnumerable<BookTag> bookTags);
        Task SaveChangesAsync();
        Task<PaginatedResult<Tag>> GetAllAsync(TagQueryObject query);
        Task<Tag?> GetByTitleAsync(string title);
    }
}