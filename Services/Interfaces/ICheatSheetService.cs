using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.DTOs;

namespace api.Services.Interfaces
{
    public interface ICheatSheetService
    {
        Task<CheatSheet> GenerateCheatSheet(string userRequest);
    }
}