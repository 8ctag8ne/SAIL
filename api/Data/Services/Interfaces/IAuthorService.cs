//api/Services/Interfaces/IAuthorService.cs
using api.Models.Entities;
using MilLib.Helpers;
using MilLib.Models.DTOs.Author;

namespace MilLib.Services.Interfaces
{
    public interface IAuthorService
    {
        Task<PaginatedResult<AuthorDto>> GetAllAuthorsAsync(AuthorQueryObject query);
        Task<AuthorDto?> GetAuthorByIdAsync(int id);
        Task<AuthorDto> CreateAuthorAsync(AuthorCreateDto authorDto);
        Task<AuthorDto> UpdateAuthorAsync(int id, AuthorUpdateDto authorDto);
        Task DeleteAuthorAsync(int id);
    }
}