namespace MilLib.Services.Interfaces
{
    public record FileResponse(Stream Content, string ContentType, string FileName);

    public interface IFileService
    {
        Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, string destination);
        Task DeleteAsync(string filePath);
        string GetFullUrl(string relativePath);
        // Головна зміна: повертаємо потік
        Task<FileResponse> GetFileAsync(string relativePath, string downloadName);

        public async Task<string?> UploadAsync(IFormFile? file, string destination)
        {
            if (file == null || file.Length == 0)
                return null;

            using var stream = file.OpenReadStream();
            return await UploadAsync(stream, file.FileName, file.ContentType, destination);
        }
    }
}