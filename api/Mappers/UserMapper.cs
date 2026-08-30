using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.DTOs.Account;
using api.Models.Entities;
using Microsoft.AspNetCore.Identity;

namespace api.Mappers
{
    public static class UserMapper
    {
        public async static Task<UserDto> toUserDto(this User user, UserManager<User> userManager)
        {
            return new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                PhoneNumber = user.PhoneNumber,
                Email = user.Email,
                About = user.About,
                IsBanned = user.IsBanned,
                BanReason = user.IsBanned ? (string.IsNullOrWhiteSpace(user.BanReason) ? "Порушення правил спільноти" : user.BanReason) : null,
                BannedAt = user.BannedAt,
                Roles = (List<string>)await userManager.GetRolesAsync(user),
            };
        }
    }
}