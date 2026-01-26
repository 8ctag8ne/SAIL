//api/Services/Interfaces/ITagService.cs
using api.Models.Entities;
using MilLib.Helpers;
using MilLib.Models.DTOs.Tag;

namespace MilLib.Services.Interfaces
{
    public interface ITagService
    {
        Task<PaginatedResult<TagDto>> GetAllTagsAsync(TagQueryObject query);
        Task<TagDto?> GetTagByIdAsync(int id);
        Task<TagDto> CreateTagAsync(TagCreateDto tagDto);
        Task<TagDto> UpdateTagAsync(int id, TagUpdateDto tagDto);
        Task DeleteTagAsync(int id);
    }
}