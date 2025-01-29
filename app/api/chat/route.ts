export const runtime = "edge"; // Enable Edge runtime for better performance

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received request body:", body);

        if (!body.input || body.input.trim() === "") {
            return new Response(JSON.stringify({ error: "Input cannot be empty" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const API_KEY = process.env.GEMINI_API_KEY;
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: body.input }] }],
            }),
        });

        const data = await response.json();
        console.log("Gemini API Response:", data);

        if (!response.ok) {
            return new Response(JSON.stringify({ error: data.error.message }), {
                status: response.status,
                headers: { "Content-Type": "application/json" },
            });
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

        return new Response(JSON.stringify({ text: responseText }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
