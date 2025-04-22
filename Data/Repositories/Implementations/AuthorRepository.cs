using Microsoft.EntityFrameworkCore;
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
                .ToListAsync();
        }

        public async Task<Author?> GetByIdWithBooksAsync(int id)
        {
            return await _context.Authors
                .Include(a => a.Books)
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
    }
}
