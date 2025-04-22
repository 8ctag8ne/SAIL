using MilLib.Repositories;
using MilLib.Services.Interfaces;
using MilLib.Models;
using MilLib.Models.Entities;
using MilLib.Helpers;
namespace MilLib.Repositories.Interfaces
{
    public interface IBookRepository
    {
        Task<IEnumerable<Book>> GetAllAsync(BookQueryObject query);
        Task<Book?> GetByIdAsync(int id);
        Task<Book?> GetByIdWithDetailsAsync(int id);
        Task<bool> TitleExistsAsync(string title);
        Task<bool> AuthorExistsAsync(int authorId);
        Task AddAsync(Book book, List<int> tagIds);
        Task UpdateAsync(Book book, List<int> tagIds);
        Task DeleteAsync(Book book);
        Task<List<Book>> GetByIdsAsync(List<int> Ids);
    }
}
