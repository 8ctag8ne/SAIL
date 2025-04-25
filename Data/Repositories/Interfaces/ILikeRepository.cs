using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;
using MilLib.Models.Entities;

namespace api.Data.Repositories.Interfaces
{
    public interface ILikeRepository
    {
        Task AddAsync(Like like); 
        Task RemoveAsync(Like like);
        Task<Like?> GetAsync(int BookId, string UserId);
        public int GetLikesCount(int BookId);
        Task<List<Like>> GetUserLikesAsync(User user);
    }
}