"use server";

import { cookies } from "next/headers";

export async function verifyPassword(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD || "matkhau";
  
  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set("game_auth", correctPassword, {
      httpOnly: true, // Bảo mật, chặn Javascript đọc từ client
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
      path: "/",
      sameSite: "lax"
    });
    return { success: true };
  }
  
  return { success: false, error: "Mật khẩu không chính xác!" };
}
