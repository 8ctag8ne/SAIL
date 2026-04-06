//api/Services/Implementations/AuthorService.cs
using api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using MilLib.Helpers;
using MilLib.Models.DTOs.Author;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class AuthorService : IAuthorService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;

        public AuthorService(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<PaginatedResult<AuthorDto>> GetAllAuthorsAsync(AuthorQueryObject query)
        {
            var authorsQuery = _context.Authors.AsQueryable();

            // Фільтрація за іменем
            if (!string.IsNullOrEmpty(query.Title))
            {
                authorsQuery = authorsQuery.Where(a => a.Name!.Contains(query.Title));
            }

            // Сортування
            if (!string.IsNullOrEmpty(query.SortBy))
            {
                authorsQuery = query.SortBy.ToLower() switch
                {
                    "name" => query.IsDescending
                        ? authorsQuery.OrderByDescending(a => a.Name)
                        : authorsQuery.OrderBy(a => a.Name),
                    _ => authorsQuery.OrderByDescending(a => a.Id)
                };
            }
            else
            {
                authorsQuery = authorsQuery.OrderByDescending(a => a.Id);
            }

            var totalItems = await authorsQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);
            var currentPage = Math.Clamp(query.PageNumber, 1, totalPages > 0 ? totalPages : 1);

            // ОПТИМІЗАЦІЯ: для списку тільки базова інформація + кількість книг
            var authors = await authorsQuery
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.Info,
                    a.ImageUrl,
                    BooksCount = a.Books.Count()
                })
                .AsNoTracking()
                .ToListAsync();

            var authorDtos = authors.Select(a => new AuthorDto
            {
                Id = a.Id,
                Name = a.Name,
                Info = a.Info,
                ImageUrl = _fileService.GetFullUrl(a.ImageUrl),
                Books = new List<BookSimpleDto>(), // Порожній для оптимізації списку
                BooksCount = a.BooksCount
            }).ToList();

            return new PaginatedResult<AuthorDto>
            {
                Items = authorDtos,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = currentPage
            };
        }

        public async Task<AuthorDto?> GetAuthorByIdAsync(int id)
        {
            // ОПТИМІЗАЦІЯ: проекція тільки потрібних полів книг
            var author = await _context.Authors
                .Where(a => a.Id == id)
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.Info,
                    a.ImageUrl,
                    Books = a.Books.Select(ab => new
                    {
                        ab.Book!.Id,
                        ab.Book.Title,
                        ab.Book.ImageUrl,
                        ab.Book.Info
                    }).ToList()
                })
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (author == null) return null;

            return new AuthorDto
            {
                Id = author.Id,
                Name = author.Name,
                Info = author.Info,
                ImageUrl = _fileService.GetFullUrl(author.ImageUrl),
                Books = author.Books.Select(b => new BookSimpleDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = _fileService.GetFullUrl(b.ImageUrl),
                }).ToList(),
                BooksCount = author.Books.Count
            };
        }

        public async Task<AuthorDto> CreateAuthorAsync(AuthorCreateDto authorDto)
        {
            // Валідація унікальності імені
            if (await _context.Authors.AnyAsync(a => a.Name == authorDto.Name))
                throw new InvalidOperationException("Author with this name already exists");

            // Завантаження зображення
            string? imageUrl = null;
            if (authorDto.Image != null && authorDto.Image.Length > 0)
            {
                imageUrl = await _fileService.UploadAsync(authorDto.Image, "Authors/Images");
            }

            // Створення автора
            var author = new Author
            {
                Name = authorDto.Name,
                Info = authorDto.Info,
                ImageUrl = imageUrl
            };

            _context.Authors.Add(author);
            await _context.SaveChangesAsync();

            // Повертаємо створеного автора
            return await GetAuthorByIdAsync(author.Id) ?? throw new InvalidOperationException("Failed to retrieve created author");
        }

        public async Task<AuthorDto> UpdateAuthorAsync(int id, AuthorUpdateDto authorDto)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки необхідні дані
            var author = await _context.Authors
                .Where(a => a.Id == id)
                .Select(a => new { a.Id, a.Name, a.ImageUrl })
                .FirstOrDefaultAsync();

            if (author == null)
                throw new InvalidOperationException("Author not found");

            // Валідація унікальності імені (якщо змінюється)
            if (!string.IsNullOrEmpty(authorDto.Name) && author.Name != authorDto.Name)
            {
                if (await _context.Authors.AnyAsync(a => a.Name == authorDto.Name))
                    throw new InvalidOperationException("Author with this name already exists");
            }

            // Обробка зображення
            string? newImageUrl = author.ImageUrl;
            if (authorDto.Image != null && authorDto.Image.Length > 0)
            {
                if (!string.IsNullOrEmpty(author.ImageUrl))
                    await _fileService.DeleteAsync(author.ImageUrl);
                newImageUrl = await _fileService.UploadAsync(authorDto.Image, "Authors/Images");
            }

            // ОПТИМІЗАЦІЯ: ExecuteUpdateAsync замість завантаження сутності
            await _context.Authors
                .Where(a => a.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(a => a.Name, authorDto.Name ?? author.Name)
                    .SetProperty(a => a.Info, authorDto.Info)
                    .SetProperty(a => a.ImageUrl, newImageUrl));

            // Повертаємо оновленого автора
            return await GetAuthorByIdAsync(id) ?? throw new InvalidOperationException("Failed to retrieve updated author");
        }

        public async Task DeleteAuthorAsync(int id)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо мінімум даних
            var author = await _context.Authors
                .Where(a => a.Id == id)
                .Select(a => new
                {
                    a.Id,
                    a.ImageUrl,
                    BooksCount = a.Books.Count()
                })
                .FirstOrDefaultAsync();

            if (author == null)
                throw new InvalidOperationException("Author not found");


            // Видаляємо зображення
            if (!string.IsNullOrEmpty(author.ImageUrl))
                await _fileService.DeleteAsync(author.ImageUrl);

            // ОПТИМІЗАЦІЯ: видаляємо зв'язки AuthorBooks (на всяк випадок)
            await _context.AuthorBooks
                .Where(ab => ab.AuthorId == id)
                .ExecuteDeleteAsync();

            // Видаляємо автора
            _context.Authors.Remove(new Author { Id = author.Id });
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AuthorSimpleDto>> GetAllSimpleAsync()
        {
            var simpleTags = _context.Authors.AsNoTracking().Select(t => new AuthorSimpleDto
            {
                Id = t.Id,
                Name = t.Name,
            });

            return await simpleTags.ToListAsync();
        }
    }
}