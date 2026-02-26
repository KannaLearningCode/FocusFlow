import middleware from "next-auth/middleware";
export default middleware;

export const config = {
    matcher: [
        // Match all routes EXCEPT login, register, public assets, and specific public APIs
        "/((?!login|register|api/auth/register|api/auth/session|api/auth/signin|api/auth/callback|favicon.ico|_next/static|_next/image).*)",
    ],
};
