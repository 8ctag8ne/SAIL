using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using MilLib.Helpers;
using MilLib.Mappers;
using MilLib.Models.DTOs.Tag;
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

        public async Task<IEnumerable<TagSimpleDto>> GetAllSimpleAsync()
        {
            return await _context.Tags.Select(t => t.toSimpleDto()).ToListAsync();
        }

        public async Task<Tag?> GetByTitleAsync(string title)
        {
            return await _context.Tags.FirstOrDefaultAsync(t => t.Title == title);
        }
        
        public async Task<PaginatedResult<Tag>> GetAllAsync(TagQueryObject query)
        {
            var tagsQuery = _context.Tags
                .Include(t => t.Books)
                .ThenInclude(bt => bt.Book)
                .AsQueryable();

            // Фільтрація
            if (!string.IsNullOrEmpty(query.Title))
            {
                tagsQuery = tagsQuery.Where(t => t.Title.Contains(query.Title));
            }

            // Сортування
            if (!string.IsNullOrEmpty(query.SortBy))
            {
                tagsQuery = query.SortBy.ToLower() switch
                {
                    "title" => query.IsDescenging 
                        ? tagsQuery.OrderByDescending(t => t.Title) 
                        : tagsQuery.OrderBy(t => t.Title),
                    _ => tagsQuery
                };
            }
            else
            {
                tagsQuery = tagsQuery.OrderByDescending(t => t.Id);
            }

            // Пагінація
            var totalItems = await tagsQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);
            
            var currentPage = query.PageNumber;
            if (currentPage < 1) currentPage = 1;
            else if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

            var items = await tagsQuery
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .ToListAsync();

            return new PaginatedResult<Tag>
            {
                Items = items,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = currentPage
            };
        }
    }
}