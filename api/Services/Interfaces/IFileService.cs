namespace MilLib.Services.Interfaces
{
    public record FileResponse(Stream Content, string ContentType, string FileName);

    public interface IFileService
    {
        Task<string?> UploadAsync(IFormFile file, string destination);
        Task DeleteAsync(string filePath);
        string GetFullUrl(string relativePath);
        // Головна зміна: повертаємо потік
        Task<FileResponse> GetFileAsync(string relativePath, string downloadName);
    }
}