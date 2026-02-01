using Microsoft.AspNetCore.StaticFiles;
using MilLib.Services.Interfaces;
using System.Net.Mime;

namespace MilLib.Services.Implementations
{
    public class LocalFileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LocalFileService(IWebHostEnvironment environment, IHttpContextAccessor httpContextAccessor)
        {
            _environment = environment;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, string destination)
        {
            try
            {
                // Create destination directory if it doesn't exist
                var uploadsFolder = Path.Combine(_environment.WebRootPath, destination);
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate unique filename
                string FileNameWithoutSpaces = string.Join("", fileName.Split(" ", StringSplitOptions.RemoveEmptyEntries));
                var uniqueFileName = $"{Guid.NewGuid()}_{FileNameWithoutSpaces}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file
                using (var outputStream = new FileStream(filePath, FileMode.Create))
                {
                    await fileStream.CopyToAsync(outputStream);
                }

                // Return relative path
                return "/"+Path.Combine(destination, uniqueFileName).Replace("\\", "/");
            }
            catch (Exception ex)
            {
                throw new FileServiceException($"Error uploading file: {ex.Message}", ex);
            }
        }

        public Task DeleteAsync(string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    throw new ArgumentException("File path is empty or null", nameof(filePath));
                }

                var fullPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/'));

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }

                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                throw new FileServiceException($"Error deleting file: {ex.Message}", ex);
            }
        }

        public string GetFullUrl(string? relativePath)
        {
            if (string.IsNullOrEmpty(relativePath))
            {
                return string.Empty;
                // throw new ArgumentException("Path is empty or null", nameof(relativePath));
            }

            var request = _httpContextAccessor.HttpContext?.Request;
            if (request == null)
            {
                throw new InvalidOperationException("HttpContext is not available");
            }

            return $"{request.Scheme}://{request.Host}{request.PathBase}/{relativePath.TrimStart('/')}";
        }

        public async Task<FileResponse> GetFileAsync(string relativePath, string downloadName)
        {
            if (string.IsNullOrEmpty(relativePath))
                throw new ArgumentException("File path is null or empty");

            var fullPath = Path.Combine(_environment.WebRootPath, relativePath.TrimStart('/'));
            if (!File.Exists(fullPath))
                throw new FileServiceException($"File not found: {relativePath}");

            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true);

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fullPath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            var finalName = downloadName + Path.GetExtension(fullPath);

            return new FileResponse(stream, contentType, finalName);
        }
    }

// Custom exception for file service errors
    }
    public class FileServiceException : Exception
    {
        public FileServiceException(string message) : base(message)
        {
        }

        public FileServiceException(string message, Exception innerException) 
            : base(message, innerException)
        {
        }
    }