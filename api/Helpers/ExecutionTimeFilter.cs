using System.Diagnostics;
using Microsoft.AspNetCore.Mvc.Filters;

namespace api.Helpers;

public class ExecutionTimeFilter : IActionFilter
{
    private Stopwatch? _stopWatch;
    public void OnActionExecuting(ActionExecutingContext context)
    {
        _stopWatch = Stopwatch.StartNew();
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        _stopWatch?.Stop();
        var elapsedMs = _stopWatch?.ElapsedMilliseconds ?? 0;

        var readableTime = elapsedMs < 1000 
                ? $"{elapsedMs}ms" 
                : $"{elapsedMs / 1000.0:F2}s";
            
        context.HttpContext.Response.Headers.Append(
            "X-Execution-Time", 
            readableTime
        );

        var controller = context.RouteData.Values["controller"];
        var action = context.RouteData.Values["action"];
        
        context.HttpContext.Response.Headers.Append(
            "X-Endpoint",
            $"{controller}.{action}"
        );
    }
}
