using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using api.Models.Entities;

namespace api.Extensions
{
    public static class ClaimsExtension
    {
        public static string GetUsername(this ClaimsPrincipal user)
        {
            return user?.Claims
                ?.SingleOrDefault(x => x.Type == ClaimTypes.GivenName)
                ?.Value;
        }
    }
}