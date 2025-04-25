using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Data.Repositories.Interfaces;
using api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace api.Data.Repositories.Implementations
{
    public class LikeRepository : ILikeRepository
    {
        private readonly ApplicationDbContext _context;
        public LikeRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task AddAsync(Like like)
        {
            _context.Likes.Add(like);
            await _context.SaveChangesAsync();
        }

        public async Task<Like?> GetAsync(int BookId, string UserId)
        {
            return await _context.Likes.FirstOrDefaultAsync(like => like.BookId == BookId && like.UserId == UserId);
        }

        public int GetLikesCount(int BookId)
        {
            return _context.Likes.Where(like => like.BookId == BookId).Count();
        }

        public async Task RemoveAsync(Like like)
        {
            _context.Likes.Remove(like);
            await _context.SaveChangesAsync();
        }
        public async Task<List<Like>> GetUserLikesAsync(User user)
        {
            return await _context.Likes.Where(like => like.UserId == user.Id).ToListAsync();
        }
    }
}