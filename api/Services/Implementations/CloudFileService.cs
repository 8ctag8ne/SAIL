using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.IdentityModel.Tokens;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class CloudFileService : IFileService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _privateBucketName;
        private readonly string _publicBucketName;
        private readonly string _serviceUrl;

        public CloudFileService(IConfiguration config)
        {
            var options = config.GetSection("Backblaze");
            _privateBucketName = options["PrivateBucketName"] 
                ?? throw new InvalidOperationException("Backblaze:PrivateBucketName must be configured.");
            _publicBucketName = options["PublicBucketName"] 
                ?? throw new InvalidOperationException("Backblaze:PublicBucketName must be configured.");
            _serviceUrl = options["ServiceUrl"] ?? throw new InvalidOperationException("Backblaze:ServiceUrl must be configured.");

            var s3Config = new AmazonS3Config { ServiceURL = _serviceUrl };
            _s3Client = new AmazonS3Client(options["KeyId"], options["ApplicationKey"], s3Config);
        }

        private static bool IsPrivate(string path)
        {
            return path.TrimStart('/').StartsWith("Books/Files", StringComparison.OrdinalIgnoreCase);
        }

        private string GetBucketName(string path)
        {
            return IsPrivate(path) ? _privateBucketName : _publicBucketName;
        }

        public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, string destination)
        {
            var key = $"{destination.Trim('/')}/{Guid.NewGuid()}_{fileName}";
            var isPrivate = IsPrivate(destination);
            var targetBucket = isPrivate ? _privateBucketName : _publicBucketName;

            var transferUtility = new TransferUtility(_s3Client);
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = fileStream,
                Key = key,
                BucketName = targetBucket,
                ContentType = contentType,
                CannedACL = isPrivate ? S3CannedACL.Private : S3CannedACL.PublicRead
            };

            await transferUtility.UploadAsync(uploadRequest);

            return key; // Повертаємо ключ (шлях) для БД
        }

        public string GetPresignedUrl(string? relativePath, TimeSpan? expiry = null)
        {
            if (string.IsNullOrEmpty(relativePath))
            {
                return string.Empty;
            }

            var targetBucket = GetBucketName(relativePath);
            var request = new GetPreSignedUrlRequest
            {
                BucketName = targetBucket,
                Key = relativePath,
                Expires = DateTime.UtcNow.Add(expiry ?? TimeSpan.FromHours(1))
            };

            return _s3Client.GetPreSignedURL(request);
        }

        public string GetFullUrl(string? relativePath)
        {
            if (string.IsNullOrEmpty(relativePath))
            {
                return string.Empty;
            }

            if (IsPrivate(relativePath))
            {
                return GetPresignedUrl(relativePath);
            }

            // Формат посилання для публічного Backblaze S3: https://bucket.endpoint/key
            var endpointHost = _serviceUrl.Replace("https://", "").Replace("http://", "");
            return $"https://{_publicBucketName}.{endpointHost}/{relativePath}";
        }

        public async Task DeleteAsync(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;
            var targetBucket = GetBucketName(filePath);
            await _s3Client.DeleteObjectAsync(targetBucket, filePath);
        }

        public async Task<FileResponse> GetFileAsync(string relativePath, string downloadName)
        {
            var targetBucket = GetBucketName(relativePath);
            var response = await _s3Client.GetObjectAsync(targetBucket, relativePath);
            
            // Повертаємо потік напряму з хмари
            return new FileResponse(
                response.ResponseStream, 
                response.Headers.ContentType, 
                downloadName + Path.GetExtension(relativePath)
            );
        }
    }
}