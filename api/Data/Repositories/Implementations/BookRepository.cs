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
            var booksQuery = _context.Books.AsQueryable();

            // Фільтрація
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

            // Сортування
            if (!string.IsNullOrEmpty(query.SortBy) && query.SortBy.ToLower() == "title")
            {
                booksQuery = query.IsDescenging
                    ? booksQuery.OrderByDescending(b => b.Title)
                    : booksQuery.OrderBy(b => b.Title);
            }
            else
            {
                booksQuery = booksQuery.OrderByDescending(b => b.Id);
            }

            var totalItems = await booksQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);

            // Коригування номера сторінки
            var currentPage = Math.Clamp(query.PageNumber, 1, totalPages > 0 ? totalPages : 1);

            // Додаємо Include тільки для сторінки даних
            var items = await booksQuery
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .Include(b => b.Tags).ThenInclude(bt => bt.Tag)
                .Include(b => b.Authors).ThenInclude(ab => ab.Author)
                .AsSplitQuery() // Важливо для продуктивності
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
                .Where(ubl => ubl.BookList != null && 
                            ubl.BookList.UserId == userId && 
                            ubl.BookId == bookId && 
                            ubl.BookListId != null)
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
                .Where(b => b.Id == id)
                .Select(b => new Book 
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = b.ImageUrl,
                    Info = b.Info,
                    FileUrl = b.FileUrl,
                    LikesCount = b.LikesCount,

                    Tags = b.Tags.Select(t => new BookTag
                    {
                        Tag = new Tag { Id = t.Tag.Id, Title = t.Tag.Title }
                    }).ToList(),
                    
                    Comments = b.Comments.Select(c => new Comment
                    {
                        Id = c.Id,
                        Content = c.Content,
                        User = new User { Id = c.User.Id, UserName = c.User.UserName }
                    }).ToList(),
                    
                    Authors = b.Authors.Select(a => new AuthorBook
                    {
                        Author = new Author { Id = a.Author.Id, Name = a.Author.Name }
                    }).ToList()
                })
                .AsNoTracking()
                .FirstOrDefaultAsync();
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
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.Entry(book).Property(x => x.Title).IsModified = !string.IsNullOrEmpty(book.Title);
                _context.Entry(book).Property(x => x.Info).IsModified = book.Info != null;
                _context.Entry(book).Property(x => x.ImageUrl).IsModified = book.ImageUrl != null;
                _context.Entry(book).Property(x => x.FileUrl).IsModified = book.FileUrl != null;
                _context.Entry(book).Property(x => x.LikesCount).IsModified = book.LikesCount >= 0;

                if (tagIds != null)
                {
                    await _context.Database.ExecuteSqlInterpolatedAsync(
                        $"DELETE FROM BookTags WHERE BookId = {book.Id}");

                    var bookTags = tagIds.Select(tagId => new BookTag { BookId = book.Id, TagId = tagId }).ToList();
                    await _context.BookTags.AddRangeAsync(bookTags);
                }

                if (authorIds != null)
                {
                    await _context.Database.ExecuteSqlInterpolatedAsync(
                        $"DELETE FROM AuthorBooks WHERE BookId = {book.Id}");

                    var authorBooks = authorIds.Select(authorId => 
                        new AuthorBook { BookId = book.Id, AuthorId = authorId }).ToList();
                    await _context.AuthorBooks.AddRangeAsync(authorBooks);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
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
            return await _context.Books
                .Where(b => Ids.Contains(b.Id))
                .Select(b => new Book
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = b.ImageUrl,
                    Info = b.Info,
                    FileUrl = b.FileUrl,
                    LikesCount = b.LikesCount,
                    Tags = b.Tags.Select(t => new BookTag
                    {
                        Tag = new Tag { Id = t.Tag.Id, Title = t.Tag.Title }
                    }).ToList(),
                    Authors = b.Authors.Select(a => new AuthorBook
                    {
                        Author = new Author { Id = a.Author.Id, Name = a.Author.Name }
                    }).ToList()
                })
                .AsNoTracking()
                .ToListAsync();
        }
        public async Task<List<Book>> SearchByKeywords(List<string> keywords, int limit = 20)
        {
            var books = await _context.Books
                .Where(b => keywords.Any(k => b.Title.Contains(k) || b.Info.Contains(k)))
                .Include(b => b.Tags)
                    .ThenInclude(bt => bt.Tag)
                .Include(b => b.Authors)
                    .ThenInclude(ab => ab.Author)
                .Take(limit)
                .ToListAsync();

            return books;
        }
    }
}
