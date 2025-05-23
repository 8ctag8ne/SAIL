using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.DTOs.Account
{
    public class RoleUpdateDto
    {
        public string UserId { get; set; }
        public string NewRole { get; set; }
    }
}