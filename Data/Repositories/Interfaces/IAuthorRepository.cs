using MilLib.Models.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MilLib.Repositories.Interfaces
{
    public interface IAuthorRepository
    {
        Task<IEnumerable<Author>> GetAllWithBooksAsync();
        Task<Author?> GetByIdWithBooksAsync(int id);
        Task<Author?> GetByIdAsync(int id);
        Task AddAsync(Author author);
        void Update(Author author);
        void Remove(Author author);
        Task<bool> ExistsAsync(int id);
        Task SaveChangesAsync();
    }
}
