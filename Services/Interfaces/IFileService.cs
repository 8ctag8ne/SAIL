using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace MilLib.Services.Interfaces
{
    public interface IFileService
    {
        public abstract Task<string?> UploadAsync(IFormFile? file, string destination);
        public abstract string GetFullUrl(string destination);
        public abstract Task DeleteAsync(string filePath);
    }
}