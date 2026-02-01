using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.IdentityModel.Tokens;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class CloudFileService : IFileService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _serviceUrl;

        public CloudFileService(IConfiguration config)
        {
            var options = config.GetSection("Backblaze");
            _bucketName = options["BucketName"]!;
            _serviceUrl = options["ServiceUrl"]!;

            var s3Config = new AmazonS3Config { ServiceURL = _serviceUrl };
            _s3Client = new AmazonS3Client(options["KeyId"], options["ApplicationKey"], s3Config);
        }
        public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, string destination)
        {
            var key = $"{destination.Trim('/')}/{Guid.NewGuid()}_{fileName}";

            var transferUtility = new TransferUtility(_s3Client);
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = fileStream,
                Key = key,
                BucketName = _bucketName,
                ContentType = contentType,
                CannedACL = S3CannedACL.PublicRead // Щоб файли відкривалися за посиланням
            };

            await transferUtility.UploadAsync(uploadRequest);

            return key; // Повертаємо ключ (шлях) для БД
        }

        public string GetFullUrl(string? relativePath)
        {
            if(relativePath.IsNullOrEmpty())
            {
                return string.Empty;
            }
            // Формат посилання для Backblaze S3: https://bucket.endpoint/key
            var endpointHost = _serviceUrl.Replace("https://", "");
            return $"https://{_bucketName}.{endpointHost}/{relativePath}";
        }

        public async Task DeleteAsync(string filePath)
        {
            await _s3Client.DeleteObjectAsync(_bucketName, filePath);
        }

        public async Task<FileResponse> GetFileAsync(string relativePath, string downloadName)
        {
            var response = await _s3Client.GetObjectAsync(_bucketName, relativePath);
            
            // Повертаємо потік напряму з хмари
            return new FileResponse(
                response.ResponseStream, 
                response.Headers.ContentType, 
                downloadName + Path.GetExtension(relativePath)
            );
        }
    }
}