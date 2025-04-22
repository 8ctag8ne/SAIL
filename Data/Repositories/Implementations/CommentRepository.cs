using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;

namespace MilLib.Repositories
{
    public class CommentRepository : ICommentRepository
    {
        private readonly ApplicationDbContext _context;

        public CommentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Comment>> GetAllWithRepliesAsync()
        {
            return await _context.Comments.Include(a => a.Replies).ToListAsync();
        }

        public async Task<Comment> GetByIdAsync(int id)
        {
            return await _context.Comments.FindAsync(id);
        }

        public async Task<Comment> GetByIdWithRepliesAsync(int id)
        {
            return await _context.Comments
                .Include(a => a.Replies)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<IEnumerable<Comment>> GetRepliesForCommentAsync(int commentId)
        {
            return await _context.Comments
                .Where(c => c.ReplyToId == commentId)
                .ToListAsync();
        }

        public async Task AddAsync(Comment comment)
        {
            await _context.Comments.AddAsync(comment);
        }

        public Task UpdateAsync(Comment comment)
        {
            _context.Comments.Update(comment);
            return Task.CompletedTask;
        }

        public Task UpdateRangeAsync(IEnumerable<Comment> comments)
        {
            _context.Comments.UpdateRange(comments);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Comment comment)
        {
            _context.Comments.Remove(comment);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}