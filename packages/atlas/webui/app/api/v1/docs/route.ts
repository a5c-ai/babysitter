import { NextResponse } from "next/server";

export const dynamic = "force-static";

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Atlas Catalog API — Swagger UI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body { margin: 0; background: #fafafa; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.addEventListener("load", function () {
        window.ui = SwaggerUIBundle({
          url: "/api/v1/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout"
        });
      });
    </script>
  </body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
