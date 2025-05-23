using MilLib.Models.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MilLib.Repositories.Interfaces
{
    public interface IBookListRepository
    {
        Task<IEnumerable<BookList>> GetAllWithBooksAsync();
        Task<BookList?> GetByIdWithBooksAsync(int id);
        Task<BookList?> GetByIdAsync(int id);
        Task AddAsync(BookList bookList);
        void Update(BookList bookList);
        void Remove(BookList bookList);
        Task ClearBooksAsync(int bookListId);
        Task SaveChangesAsync();
    }
}
