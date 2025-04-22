using System.Collections.Generic;
using System.Threading.Tasks;
using MilLib.Models.Entities;

namespace MilLib.Repositories.Interfaces
{
    public interface ICommentRepository
    {
        Task<IEnumerable<Comment>> GetAllWithRepliesAsync();
        Task<Comment> GetByIdAsync(int id);
        Task<Comment> GetByIdWithRepliesAsync(int id);
        Task<IEnumerable<Comment>> GetRepliesForCommentAsync(int commentId);
        Task AddAsync(Comment comment);
        Task UpdateAsync(Comment comment);
        Task UpdateRangeAsync(IEnumerable<Comment> comments);
        Task DeleteAsync(Comment comment);
        Task SaveChangesAsync();
    }
}