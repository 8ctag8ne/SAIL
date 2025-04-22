using System.Collections.Generic;
using System.Threading.Tasks;
using MilLib.Models.Entities;

namespace MilLib.Repositories.Interfaces
{
    public interface ITagRepository
    {
        Task<IEnumerable<Tag>> GetAllWithBooksAsync();
        Task<Tag> GetByIdWithBooksAsync(int id);
        Task<Tag> GetByIdAsync(int id);
        Task AddAsync(Tag tag);
        Task UpdateAsync(Tag tag);
        Task DeleteAsync(Tag tag);
        Task<IEnumerable<BookTag>> GetBookTagsByTagIdAsync(int tagId);
        Task RemoveBookTagsRangeAsync(IEnumerable<BookTag> bookTags);
        Task SaveChangesAsync();
    }
}