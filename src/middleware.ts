import { NextResponse } from "next/server";

// Middleware simple sans Edge Runtime
// La protection des routes se fait côté serveur dans les composants
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
