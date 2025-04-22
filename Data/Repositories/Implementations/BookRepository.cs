using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilLib.Helpers;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;

namespace MilLib.Repositories.Implementations
{
    public class BookRepository : IBookRepository
    {
        private readonly ApplicationDbContext _context;

        public BookRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Book>> GetAllAsync(BookQueryObject query)
        {
            var books = _context.Books
                .Include(b => b.Tags)
                    .ThenInclude(bt => bt.Tag)
                .AsQueryable();

            if (!query.Title.IsNullOrEmpty())
            {
                books = books.Where(b => b.Title.Contains(query.Title));
            }

            if (query.TagIds != null && query.TagIds.Any())
            {
                books = books.Where(b => b.Tags.Any(t => query.TagIds.Contains(t.TagId)));
            }

            if (query.AuthorId != null)
            {
                books = books.Where(b => b.AuthorId == query.AuthorId);
            }

            if (query.SortBy is not null && query.SortBy.ToLower() == "title")
            {
                books = query.IsDescenging
                    ? books.OrderByDescending(b => b.Title)
                    : books.OrderBy(b => b.Title);
            }

            books = books
                .Skip(query.PageSize * (query.PageNumber - 1))
                .Take(query.PageSize);

            return await books.ToListAsync();
        }

        public async Task<Book?> GetByIdAsync(int id)
        {
            return await _context.Books.FindAsync(id);
        }

        public async Task<Book?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Books
                .Include(b => b.Tags)
                    .ThenInclude(t => t.Tag)
                .Include(b => b.Comments)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<bool> TitleExistsAsync(string title)
        {
            return await _context.Books.AnyAsync(b => b.Title == title);
        }

        public async Task<bool> AuthorExistsAsync(int authorId)
        {
            return await _context.Authors.AnyAsync(a => a.Id == authorId);
        }

        public async Task AddAsync(Book book, List<int> tagIds)
        {
            var tags = await _context.Tags.Where(t => tagIds.Contains(t.Id)).ToListAsync();
            book.Tags = tags.Select(t => new BookTag { Book = book, Tag = t }).ToList();

            _context.Books.Add(book);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Book book, List<int> tagIds)
        {
            var existingBookTags = await _context.BookTags.Where(bt => bt.BookId == book.Id).ToListAsync();
            _context.BookTags.RemoveRange(existingBookTags);

            var tags = await _context.Tags.Where(t => tagIds.Contains(t.Id)).ToListAsync();
            book.Tags = tags.Select(t => new BookTag { Book = book, Tag = t }).ToList();

            _context.Books.Update(book);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Book book)
        {
            _context.Books.Remove(book);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Book>> GetByIdsAsync(List<int> Ids)
        {
            return await _context.Books.Where(b => Ids.Contains(b.Id)).ToListAsync();
        }
    }
}
