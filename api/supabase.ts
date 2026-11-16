export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { url, method, headers, body } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing URL in request body" });
  }

  console.log(`Proxying ${method || "GET"} request to: ${url}`);

  try {
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: {
        ...headers,
        apikey: supabaseKey,
        Authorization: headers?.Authorization || `Bearer ${supabaseKey}`,
      },
    };

    if (body && method !== "GET" && method !== "HEAD") {
      fetchOptions.body =
        typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    // Handle 204 No Content
    if (response.status === 204) {
      return res.status(204).send("");
    }

    // Forward headers
    response.headers.forEach((value, key) => {
      // Skip some headers that might cause issues
      if (
        !["content-encoding", "content-length", "transfer-encoding"].includes(
          key.toLowerCase(),
        )
      ) {
        res.setHeader(key, value);
      }
    });

    const buffer = await response.arrayBuffer();
    console.log(
      `Proxy response: ${response.status}, size: ${buffer.byteLength} bytes`,
    );

    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy fetch error:", error);
    res.status(500).json({
      error: "Failed to proxy request",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
