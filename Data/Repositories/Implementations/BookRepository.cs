using api.Models.Entities;
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

        public async Task<PaginatedResult<Book>> GetAllAsync(BookQueryObject query)
        {
            var booksQuery = _context.Books
                .Include(b => b.Tags)
                    .ThenInclude(bt => bt.Tag)
                .Include(b => b.Authors)
                    .ThenInclude(ab => ab.Author)
                .AsQueryable();

            if (!string.IsNullOrEmpty(query.Title))
            {
                booksQuery = booksQuery.Where(b => b.Title.Contains(query.Title));
            }

            if (query.TagIds != null && query.TagIds.Any())
            {
                booksQuery = booksQuery.Where(b => b.Tags.Any(t => query.TagIds.Contains(t.TagId)));
            }

            if (query.AuthorId != null)
            {
                booksQuery = booksQuery.Where(b => b.Authors.Any(ab => ab.AuthorId == query.AuthorId));
            }

            if (!string.IsNullOrEmpty(query.SortBy) && query.SortBy.ToLower() == "title")
            {
                booksQuery = query.IsDescenging
                    ? booksQuery.OrderByDescending(b => b.Title)
                    : booksQuery.OrderBy(b => b.Title);
            }

            booksQuery = booksQuery.OrderByDescending(b => b.Id); //сортування у зворотньому порядку (відображення нових книг спочатку)

            var totalItems = await booksQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);

            // Коригування номера сторінки
            var currentPage = query.PageNumber;
            if (currentPage < 1)
                currentPage = 1;
            else if (currentPage > totalPages && totalPages > 0)
                currentPage = totalPages;

            var items = await booksQuery
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .ToListAsync();

            return new PaginatedResult<Book>
            {
                Items = items,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = currentPage
            };
        }

        public async Task<List<int>> GetUserBookListIdsAsync(string userId, int bookId)
        {
            return await _context.BookListBooks
            .Include(ubl => ubl.BookList)
                .Where(ubl => ubl.BookList != null && ubl.BookList.UserId == userId && ubl.BookId == bookId && ubl.BookListId != null)
                .Select(ubl => ubl.BookListId.Value)
                .ToListAsync();
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
                    .ThenInclude(c => c.User)
                .Include(b => b.Authors)
                    .ThenInclude(ab => ab.Author)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<bool> TitleExistsAsync(string title)
        {
            return await _context.Books.AnyAsync(b => b.Title == title);
        }

        public async Task<List<int>> GetMissingAuthorIdsAsync(List<int> authorIds)
        {
            var existingIds = await _context.Authors
                .Where(a => authorIds.Contains(a.Id))
                .Select(a => a.Id)
                .ToListAsync();
            return authorIds.Except(existingIds).ToList();
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

        public async Task UpdateAsync(Book book, List<int>? tagIds = null, List<int>? authorIds = null)
        {
            if(tagIds != null)
            {
                var existingBookTags = await _context.BookTags.Where(bt => bt.BookId == book.Id).ToListAsync();
                _context.BookTags.RemoveRange(existingBookTags);

                var tags = await _context.Tags.Where(t => tagIds.Contains(t.Id)).ToListAsync();
                book.Tags = tags.Select(t => new BookTag { Book = book, Tag = t }).ToList();
            }

            if(authorIds != null)
            {
                var existingAuthorBooks = await _context.AuthorBooks.Where(ab => ab.BookId == book.Id).ToListAsync();
                _context.AuthorBooks.RemoveRange(existingAuthorBooks);

                foreach (var authorId in authorIds)
                {
                    book.Authors.Add(new AuthorBook { AuthorId = authorId, BookId = book.Id });
                }
            }

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

        public async Task<List<Book>> GetByIdsWithDetailsAsync(List<int> Ids)
        {
            return await _context.Books.Where(b => Ids.Contains(b.Id))
                .Include(b => b.Tags)
                    .ThenInclude(t => t.Tag)
                // .Include(b => b.Comments)
                    // .ThenInclude(c => c.User)
                .Include(b => b.Authors)
                    .ThenInclude(ab => ab.Author)
                .ToListAsync();
        }
    }
}
