namespace MilLib.Services.Interfaces
{
    public interface IFileService
    {
        public abstract Task<string?> UploadAsync(IFormFile? file, string destination);
        public abstract string GetFullUrl(string destination);
        public abstract Task DeleteAsync(string filePath);
        public abstract Task<(byte[] FileContent, string ContentType, string DownloadFileName)> GetBookFileAsync(string relativePath, string title, string authorFullName);
    }
}