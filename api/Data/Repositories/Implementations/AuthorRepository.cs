using api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using MilLib.Helpers;
using MilLib.Mappers;
using MilLib.Models.DTOs.Author;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MilLib.Repositories
{
    public class AuthorRepository : IAuthorRepository
    {
        private readonly ApplicationDbContext _context;

        public AuthorRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Author>> GetAllWithBooksAsync()
        {
            return await _context.Authors
                .Include(a => a.Books)
                    .ThenInclude(ab => ab.Book)
                .ToListAsync();
        }
        public async Task<IEnumerable<AuthorSimpleDto>> GetAllSimpleAsync()
        {
            return await _context.Authors.Select(a => a.toSimpleDto()).ToListAsync();
        }

        public async Task<Author?> GetByIdWithBooksAsync(int id)
        {
            return await _context.Authors
                .Include(a => a.Books)
                    .ThenInclude(ab => ab.Book)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Author?> GetByIdAsync(int id)
        {
            return await _context.Authors.FindAsync(id);
        }

        public async Task AddAsync(Author author)
        {
            await _context.Authors.AddAsync(author);
        }

        public void Update(Author author)
        {
            _context.Authors.Update(author);
        }

        public void Remove(Author author)
        {
            _context.Authors.Remove(author);
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Authors.AnyAsync(a => a.Id == id);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<PaginatedResult<Author>> GetAllAsync(AuthorQueryObject query)
        {
            var authorsQuery = _context.Authors
                .Include(a => a.Books)
                    .ThenInclude(ab => ab.Book)
                .AsQueryable();

            // Фільтрація за ім'ям
            if (!string.IsNullOrEmpty(query.Title))
                authorsQuery = authorsQuery.Where(a => a.Name.Contains(query.Title));

            // Сортування
            if (!string.IsNullOrEmpty(query.SortBy))
            {
                authorsQuery = query.SortBy.ToLower() switch
                {
                    "name" => query.IsDescending
                        ? authorsQuery.OrderByDescending(a => a.Name) 
                        : authorsQuery.OrderBy(a => a.Name),
                    _ => authorsQuery
                };
            }
            else
            {
                authorsQuery = authorsQuery.OrderByDescending(a => a.Id);
            }

            // Пагінація
            var totalItems = await authorsQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);
            
            var currentPage = query.PageNumber;
            if (currentPage < 1) currentPage = 1;
            else if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

            var items = await authorsQuery
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .ToListAsync();

            return new PaginatedResult<Author>
            {
                Items = items,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = currentPage
            };
        }
    }
}
