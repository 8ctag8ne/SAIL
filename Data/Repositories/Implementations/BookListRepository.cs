using Microsoft.EntityFrameworkCore;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Repositories
{
    public class BookListRepository : IBookListRepository
    {
        private readonly ApplicationDbContext _context;

        public BookListRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BookList>> GetAllWithBooksAsync()
        {
            return await _context.BookLists.Include(b => b.Books).ThenInclude(bb => bb.Book).ToListAsync();
        }

        public async Task<BookList?> GetByIdWithBooksAsync(int id)
        {
            return await _context.BookLists.Include(b => b.Books).ThenInclude(bb => bb.Book)
                                           .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<BookList?> GetByIdAsync(int id)
        {
            return await _context.BookLists.FindAsync(id);
        }

        public async Task AddAsync(BookList bookList)
        {
            await _context.BookLists.AddAsync(bookList);
        }

        public void Update(BookList bookList)
        {
            _context.BookLists.Update(bookList);
        }

        public void Remove(BookList bookList)
        {
            _context.BookLists.Remove(bookList);
        }

        public async Task ClearBooksAsync(int bookListId)
        {
            var existing = await _context.BookListBooks.Where(x => x.BookListId == bookListId).ToListAsync();
            _context.BookListBooks.RemoveRange(existing);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
