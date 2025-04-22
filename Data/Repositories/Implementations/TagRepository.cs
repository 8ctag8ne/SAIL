using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;

namespace MilLib.Repositories
{
    public class TagRepository : ITagRepository
    {
        private readonly ApplicationDbContext _context;

        public TagRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Tag>> GetAllWithBooksAsync()
        {
            return await _context.Tags.Include(a => a.Books).ThenInclude(bt => bt.Book).ToListAsync();
        }

        public async Task<Tag> GetByIdWithBooksAsync(int id)
        {
            return await _context.Tags
                .Include(a => a.Books)
                .ThenInclude(bt => bt.Book)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Tag> GetByIdAsync(int id)
        {
            return await _context.Tags.FindAsync(id);
        }

        public async Task AddAsync(Tag tag)
        {
            await _context.Tags.AddAsync(tag);
        }

        public Task UpdateAsync(Tag tag)
        {
            _context.Tags.Update(tag);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Tag tag)
        {
            _context.Tags.Remove(tag);
            return Task.CompletedTask;
        }

        public async Task<IEnumerable<BookTag>> GetBookTagsByTagIdAsync(int tagId)
        {
            return await _context.BookTags.Where(bt => bt.TagId == tagId).ToListAsync();
        }

        public Task RemoveBookTagsRangeAsync(IEnumerable<BookTag> bookTags)
        {
            _context.BookTags.RemoveRange(bookTags);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}