using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;
using Microsoft.AspNetCore.Identity;

namespace api.Extensions
{
    public static class UserExtension
    {
        public static async Task<bool> IsAdmin(this User user, UserManager<User> userManager)
        {
            var roles = await userManager.GetRolesAsync(user);

            return roles.Any(role => role == "Admin");
        }

        public static async Task<bool> IsLibrarian(this User user, UserManager<User> userManager)
        {
            var roles = await userManager.GetRolesAsync(user);

            return roles.Any(role => role == "Librarian");
        }
    }
}