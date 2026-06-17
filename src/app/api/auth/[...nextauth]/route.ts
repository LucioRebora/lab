import NextAuth, { NextAuthOptions } from "next-auth";
import { NextRequest } from "next/server";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.OAUTH_CLIENT_ID!,
            clientSecret: process.env.OAUTH_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findFirst({
                    where: {
                        email: {
                            equals: credentials.email,
                            mode: 'insensitive'
                        }
                    },
                });

                if (!user) {
                    throw new Error("Usuario no registrado");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Email o contraseña incorrectos");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    laboratoryId: user.laboratoryId,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                if (!user.email) return false;

                // Buscar si existe el usuario
                let dbUser = await prisma.user.findFirst({
                    where: {
                        email: {
                            equals: user.email,
                            mode: 'insensitive'
                        }
                    }
                });

                // Si no existe, rechazamos el login
                if (!dbUser) {
                    return "/login?error=UsuarioNoRegistrado";
                }

                // Mapeamos los datos al objeto de sesión
                user.id = dbUser.id;
                (user as any).role = dbUser.role;
                (user as any).laboratoryId = dbUser.laboratoryId;
                return true;
            }
            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            if (trigger === "update" && session) {
                if (session.name !== undefined) token.name = session.name;
            }
            if (user) {
                token.id = user.id;
                // Preserve role and param added from sign in callback or credentials logic
                token.role = (user as any).role || "USER";
                token.laboratoryId = (user as any).laboratoryId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).laboratoryId = token.laboratoryId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    events: {
        async signIn({ user }) {
            await createAuditLog({
                userId: user.id || null,
                userName: user.name || user.email || null,
                action: "LOGIN",
                details: "Inicio de sesión exitoso",
                laboratoryId: (user as any).laboratoryId || null,
            });
        },
        async signOut({ token }) {
            if (token) {
                await createAuditLog({
                    userId: (token.id as string) || null,
                    userName: (token.name || token.email) as string || null,
                    action: "LOGOUT",
                    details: "Cierre de sesión",
                    laboratoryId: (token.laboratoryId as string) || null,
                });
            }
        }
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = async (req: NextRequest, ctx: any) => {
    const rememberCookie = req.cookies.get("remember-session")?.value;
    const isRemember = rememberCookie === "true";

    const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NODE_ENV === 'production';
    const cookiePrefix = useSecureCookies ? "__Secure-" : "";

    const dynamicOptions: NextAuthOptions = {
        ...authOptions,
        session: {
            ...authOptions.session,
            strategy: "jwt",
            maxAge: isRemember ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // JWT valid duration
        },
    };

    if (!isRemember) {
        dynamicOptions.cookies = {
            sessionToken: {
                name: `${cookiePrefix}next-auth.session-token`,
                options: {
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                    secure: useSecureCookies,
                },
            },
        };
    }

    // Call NextAuth with dynamic options
    const nextAuthHandler = NextAuth(dynamicOptions);
    const response = await nextAuthHandler(req, ctx) as Response;

    // Intercept and modify the Set-Cookie headers to force a true session cookie
    if (!isRemember && response && response.headers.has("set-cookie")) {
        const setCookies = response.headers.getSetCookie();
        if (setCookies && setCookies.length > 0) {
            const newHeaders = new Headers(response.headers);
            newHeaders.delete("set-cookie");

            for (const cookie of setCookies) {
                if (cookie.includes("next-auth.session-token")) {
                    const modifiedCookie = cookie
                        .replace(/;\s*Max-Age=[^;]+/ig, "")
                        .replace(/;\s*Expires=[^;]+/ig, "");
                    newHeaders.append("set-cookie", modifiedCookie);
                } else {
                    newHeaders.append("set-cookie", cookie);
                }
            }

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        }
    }

    return response;
};

export { handler as GET, handler as POST };
