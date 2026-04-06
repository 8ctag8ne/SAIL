//api/Services/Implementations/BookListService.cs
using Microsoft.EntityFrameworkCore;
using MilLib.Models.DTOs.Book;
using MilLib.Models.DTOs.BookList;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class BookListService : IBookListService
    {
        private readonly ApplicationDbContext _context;

        private readonly IFileService _fileService;

        public BookListService(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<List<BookListDto>> GetAllBookListsAsync()
        {
            // Тільки для Admin - завантажує всі списки
            var bookLists = await _context.BookLists
                .Select(bl => new
                {
                    bl.Id,
                    bl.Title,
                    bl.Description,
                    bl.IsPrivate,
                    bl.UserId,
                    UserName = bl.User!.UserName,
                    Books = bl.Books.Select(blb => new
                    {
                        blb.Book!.Id,
                        blb.Book.Title,
                        blb.Book.ImageUrl
                    }).ToList()
                })
                .AsNoTracking()
                .ToListAsync();

            return bookLists.Select(bl => new BookListDto
            {
                Id = bl.Id,
                Title = bl.Title,
                Description = bl.Description,
                IsPrivate = bl.IsPrivate,
                UserId = bl.UserId,
                UserName = bl.UserName,
                Books = bl.Books.Select(b => new BookSimpleDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = _fileService.GetFullUrl(b.ImageUrl)
                }).ToList()
            }).ToList();
        }

        public async Task<List<BookListDto>> GetBookListsForUserAsync(string userId, string? currentUserId, bool isAdmin)
        {
            // ОПТИМІЗАЦІЯ: фільтруємо в SQL, а не в пам'яті
            var query = _context.BookLists
                .Where(bl => bl.UserId == userId);

            // Фільтруємо приватні списки
            if (!isAdmin && currentUserId != userId)
            {
                query = query.Where(bl => !bl.IsPrivate ?? false);
            }

            var bookLists = await query
                .Select(bl => new
                {
                    bl.Id,
                    bl.Title,
                    bl.Description,
                    bl.IsPrivate,
                    bl.UserId,
                    UserName = bl.User!.UserName,
                    Books = bl.Books.Select(blb => new
                    {
                        blb.Book!.Id,
                        blb.Book.Title,
                        blb.Book.ImageUrl
                    }).ToList()
                })
                .AsNoTracking()
                .ToListAsync();

            return bookLists.Select(bl => new BookListDto
            {
                Id = bl.Id,
                Title = bl.Title,
                Description = bl.Description,
                IsPrivate = bl.IsPrivate,
                UserId = bl.UserId,
                UserName = bl.UserName,
                Books = bl.Books.Select(b => new BookSimpleDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = _fileService.GetFullUrl(b.ImageUrl)
                }).ToList()
            }).ToList();
        }

        public async Task<BookListDto?> GetBookListByIdAsync(int id)
        {
            var bookList = await _context.BookLists
                .Where(bl => bl.Id == id)
                .Select(bl => new
                {
                    bl.Id,
                    bl.Title,
                    bl.Description,
                    bl.IsPrivate,
                    bl.UserId,
                    UserName = bl.User!.UserName,
                    Books = bl.Books.Select(blb => new
                    {
                        blb.Book!.Id,
                        blb.Book.Title,
                        blb.Book.ImageUrl,
                        blb.Book.Info
                    }).ToList()
                })
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (bookList == null) return null;

            return new BookListDto
            {
                Id = bookList.Id,
                Title = bookList.Title,
                Description = bookList.Description,
                IsPrivate = bookList.IsPrivate,
                UserId = bookList.UserId,
                UserName = bookList.UserName,
                Books = bookList.Books.Select(b => new BookSimpleDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = _fileService.GetFullUrl(b.ImageUrl),
                    Info = b.Info
                }).ToList()
            };
        }

        public async Task<BookListDto> CreateBookListAsync(BookListCreateDto bookListDto, string userId)
        {
            // Валідація книг
            if (bookListDto.BookIds != null && bookListDto.BookIds.Any())
            {
                var existingBookIds = await _context.Books
                    .Where(b => bookListDto.BookIds.Contains(b.Id))
                    .Select(b => b.Id)
                    .ToListAsync();

                var missingBookIds = bookListDto.BookIds.Except(existingBookIds).ToList();
                if (missingBookIds.Any())
                    throw new InvalidOperationException($"Books not found: {string.Join(", ", missingBookIds)}");
            }

            // Створення списку
            var bookList = new BookList
            {
                Title = bookListDto.Title,
                Description = bookListDto.Description,
                IsPrivate = bookListDto.IsPrivate,
                UserId = userId
            };

            _context.BookLists.Add(bookList);

            // ОПТИМІЗАЦІЯ: додаємо зв'язки без завантаження книг
            if (bookListDto.BookIds != null && bookListDto.BookIds.Any())
            {
                var bookListBooks = bookListDto.BookIds.Select(bookId => new BookListBook
                {
                    BookList = bookList,
                    BookId = bookId
                }).ToList();

                _context.BookListBooks.AddRange(bookListBooks);
            }

            await _context.SaveChangesAsync();

            // Повертаємо створений список
            return await GetBookListByIdAsync(bookList.Id) ?? throw new InvalidOperationException("Failed to retrieve created book list");
        }

        public async Task<BookListDto> UpdateBookListAsync(int id, BookListUpdateDto bookListDto, string currentUserId)
        {
            // ОПТИМІЗАЦІЯ: перевіряємо права доступу без завантаження всього списку
            var bookList = await _context.BookLists
                .Where(bl => bl.Id == id)
                .Select(bl => new { bl.Id, bl.UserId })
                .FirstOrDefaultAsync();

            if (bookList == null)
                throw new InvalidOperationException("Book list not found");

            // Перевірка прав доступу
            if (bookList.UserId != currentUserId)
                throw new UnauthorizedAccessException("You don't have permission to update this book list");

            // Валідація книг
            if (bookListDto.BookIds != null && bookListDto.BookIds.Any())
            {
                var existingBookIds = await _context.Books
                    .Where(b => bookListDto.BookIds.Contains(b.Id))
                    .Select(b => b.Id)
                    .ToListAsync();

                var missingBookIds = bookListDto.BookIds.Except(existingBookIds).ToList();
                if (missingBookIds.Any())
                    throw new InvalidOperationException($"Books not found: {string.Join(", ", missingBookIds)}");
            }

            // ОПТИМІЗАЦІЯ: ExecuteUpdateAsync для оновлення полів
            await _context.BookLists
                .Where(bl => bl.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(bl => bl.Title, bookListDto.Title)
                    .SetProperty(bl => bl.Description, bookListDto.Description)
                    .SetProperty(bl => bl.IsPrivate, bookListDto.IsPrivate));

            // ОПТИМІЗАЦІЯ: ExecuteDeleteAsync для очищення старих зв'язків
            await _context.BookListBooks
                .Where(blb => blb.BookListId == id)
                .ExecuteDeleteAsync();

            // Додаємо нові зв'язки
            if (bookListDto.BookIds != null && bookListDto.BookIds.Any())
            {
                var newBookListBooks = bookListDto.BookIds.Select(bookId => new BookListBook
                {
                    BookListId = id,
                    BookId = bookId
                }).ToList();

                _context.BookListBooks.AddRange(newBookListBooks);
                await _context.SaveChangesAsync();
            }

            // Повертаємо оновлений список
            return await GetBookListByIdAsync(id) ?? throw new InvalidOperationException("Failed to retrieve updated book list");
        }

        public async Task AddBookToListsAsync(int bookId, List<int> bookListIds, string currentUserId)
        {
            // Перевіряємо чи книга існує
            var bookExists = await _context.Books.AnyAsync(b => b.Id == bookId);
            if (!bookExists)
                throw new InvalidOperationException($"Book with id {bookId} not found");

            // ОПТИМІЗАЦІЯ: одним запитом отримуємо списки користувача
            var userBookLists = await _context.BookLists
                .Where(bl => bookListIds.Contains(bl.Id) && bl.UserId == currentUserId)
                .Select(bl => bl.Id)
                .ToListAsync();

            if (!userBookLists.Any())
                throw new InvalidOperationException("No valid book lists found or you don't have permission");

            // ОПТИМІЗАЦІЯ: перевіряємо які книги вже є в списках одним запитом
            var existingEntries = await _context.BookListBooks
                .Where(blb => userBookLists.Contains(blb.BookListId!.Value) && blb.BookId == bookId)
                .Select(blb => blb.BookListId!.Value)
                .ToListAsync();

            // Додаємо тільки нові зв'язки
            var newEntries = userBookLists
                .Except(existingEntries)
                .Select(listId => new BookListBook
                {
                    BookId = bookId,
                    BookListId = listId
                })
                .ToList();

            if (newEntries.Any())
            {
                _context.BookListBooks.AddRange(newEntries);
                await _context.SaveChangesAsync();
            }
        }

        public async Task RemoveBookFromListAsync(int bookId, int listId, string currentUserId)
        {
            // Перевіряємо права доступу
            var bookList = await _context.BookLists
                .Where(bl => bl.Id == listId)
                .Select(bl => new { bl.Id, bl.UserId })
                .FirstOrDefaultAsync();

            if (bookList == null)
                throw new InvalidOperationException("Book list not found");

            if (bookList.UserId != currentUserId)
                throw new UnauthorizedAccessException("You don't have permission to modify this book list");

            // ОПТИМІЗАЦІЯ: ExecuteDeleteAsync замість завантаження та видалення
            await _context.BookListBooks
                .Where(blb => blb.BookListId == listId && blb.BookId == bookId)
                .ExecuteDeleteAsync();
        }

        public async Task DeleteBookListAsync(int id, string currentUserId)
        {
            // Перевіряємо права доступу
            var bookList = await _context.BookLists
                .Where(bl => bl.Id == id)
                .Select(bl => new { bl.Id, bl.UserId })
                .FirstOrDefaultAsync();

            if (bookList == null)
                throw new InvalidOperationException("Book list not found");

            if (bookList.UserId != currentUserId)
                throw new UnauthorizedAccessException("You don't have permission to delete this book list");

            // ОПТИМІЗАЦІЯ: ExecuteDeleteAsync для зв'язків
            await _context.BookListBooks
                .Where(blb => blb.BookListId == id)
                .ExecuteDeleteAsync();

            // Видаляємо список
            _context.BookLists.Remove(new BookList { Id = id });
            await _context.SaveChangesAsync();
        }
    }
}