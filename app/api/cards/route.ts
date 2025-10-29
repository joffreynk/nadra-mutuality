import { auth } from "@/lib/auth";
import { saveBufferToStorage } from "@/lib/storage";
import { PrismaClient } from "@prisma/client";
import { createCanvas, loadImage, registerFont } from "canvas";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const WIDTH = 1012;
const HEIGHT = 640;
const prisma = new PrismaClient();

// fonts (optional)
const REGULAR = path.join(process.cwd(), "public", "fonts", "Inter-Regular.ttf");
const BOLD = path.join(process.cwd(), "public", "fonts", "Inter-Bold.ttf");
if (fs.existsSync(REGULAR)) registerFont(REGULAR, { family: "Inter", weight: "400" });
if (fs.existsSync(BOLD)) registerFont(BOLD, { family: "Inter", weight: "700" });

async function dependentOf(memberCode?: string) {
  if (!memberCode) return null;
  const base = memberCode.includes("/") ? memberCode.split("/")[0] : memberCode;
  const depOf = await prisma.member.findFirst({
    where: { memberCode: base, isDependent: false },
    select: { name: true, memberCode: true },
  });
  return depOf;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function tryLoadImage(...candidates: (string | null | undefined)[]) {
  for (const c of candidates) {
    if (!c) continue;
    try {
      if (c.startsWith("/")) {
        const p = path.join(process.cwd(), "public", c);
        if (fs.existsSync(p)) return await loadImage(p);
      } else if (c.startsWith("http")) {
        return await loadImage(c);
      } else {
        // treat as filename under public
        const p = path.join(process.cwd(), "public", c);
        if (fs.existsSync(p)) return await loadImage(p);
      }
    } catch (e) {
      // try next candidate
    }
  }
  return null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, memberCode } = body;
    if (!memberCode && !id) {
      return NextResponse.json({ error: "Provide either id or memberCode in the request body." }, { status: 400 });
    }

    const member = await prisma.member.findFirst({
      where: id ? { id } : { memberCode },
      include: { category: true, company: true },
    });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const settings = await prisma.systemSetting.findUnique({
      where: { organizationId: member.organizationId },
    });

    const SYSTEM_NAME = settings?.systemName ?? "INSURANCE NAME";
    const WORKING_ADDRESS = settings?.location ?? member.company?.address ?? "Organization working address";
    const PHONE_NUMBER = settings?.phoneNumber ?? member.company?.phoneNumber ?? "Phone: 000000000";
    const EMAIL = settings?.email ?? member.email ?? "info@example.com";

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // Outer white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Inner rounded blue frame
    const OUTER_PADDING = Math.round(WIDTH * 0.03);
    const innerX = OUTER_PADDING;
    const innerY = OUTER_PADDING;
    const innerW = WIDTH - OUTER_PADDING * 2;
    const innerH = HEIGHT - OUTER_PADDING * 2;
    const borderRadius = Math.round(Math.min(innerW, innerH) * 0.03);

    ctx.fillStyle = "#ffffff";
    roundedRectPath(ctx, innerX, innerY, innerW, innerH, borderRadius);
    ctx.fill();

    ctx.lineWidth = Math.max(4, Math.round(WIDTH * 0.008));
    ctx.strokeStyle = "#0d6efd";
    roundedRectPath(ctx, innerX, innerY, innerW, innerH, borderRadius);
    ctx.stroke();

    // Inner margin
    const innerMargin = Math.round(WIDTH * 0.01);

    // Header stripe (red)
    const headerH = Math.round((innerH - innerMargin * 2) * 0.18);
    const headerX = innerX + innerMargin;
    const headerY = innerY + innerMargin;
    const headerW = innerW - innerMargin * 2;
    ctx.fillStyle = "#c62828";
    ctx.fillRect(headerX, headerY, headerW, headerH);

    // Header logo candidates (company logo preferred)
    const logoCandidates = [
      (member.company as any)?.logoUrl,
      member.company ? `/company-logos/${member.company.id}.png` : null,
      "/logo.png",
      (settings as any)?.logoUrl,
    ];
    const headerLogo = await tryLoadImage(...logoCandidates);

    // draw header group centered (logo left, system name right)
    const gapBetween = Math.round(headerH * 0.12);
    let logoDrawW = 0;
    let logoDrawH = 0;
    if (headerLogo) {
      const maxLogoH = Math.round(headerH * 0.75);
      const maxLogoW = Math.round(headerW * 0.25);
      const logoScale = Math.min(maxLogoH / headerLogo.height, maxLogoW / headerLogo.width);
      logoDrawW = Math.round(headerLogo.width * logoScale);
      logoDrawH = Math.round(headerLogo.height * logoScale);
    }

    // ensure font set before measureText
    ctx.font = `bold ${Math.round(headerH * 0.36)}px "Inter", sans-serif`;
    const nameMetrics = ctx.measureText(SYSTEM_NAME);
    const nameW = Math.ceil(nameMetrics.width);
    const groupW = logoDrawW > 0 ? logoDrawW + gapBetween + nameW : nameW;
    const groupX = headerX + Math.round((headerW - groupW) / 2);
    const groupYCenter = headerY + Math.round(headerH / 2);

    if (headerLogo && logoDrawW > 0) {
      const logoX = groupX;
      const logoY = groupYCenter - Math.round(logoDrawH / 2);
      ctx.drawImage(headerLogo as any, logoX, logoY, logoDrawW, logoDrawH);
    }

    const nameX = headerLogo && logoDrawW > 0 ? groupX + logoDrawW + gapBetween : headerX + Math.round(headerW / 2);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = headerLogo && logoDrawW > 0 ? "left" : "center";
    ctx.font = `bold ${Math.round(headerH * 0.36)}px "Inter", sans-serif`;
    ctx.fillText(SYSTEM_NAME, nameX, groupYCenter + Math.round(headerH * 0.13));

    // Footer stripe (dark grey) with left:center:right (location, email, phone)
    const footerH = Math.round((innerH - innerMargin * 2) * 0.12);
    const footerX = innerX + innerMargin;
    const footerY = innerY + innerH - innerMargin - footerH;
    const footerW = headerW;

    ctx.fillStyle = "#2f2f2f";
    ctx.fillRect(footerX, footerY, footerW, footerH);

    const footerPadding = Math.round(footerW * 0.04);
    ctx.fillStyle = "#ffffff";
    const footerFontSize = Math.round(footerH * 0.32);
    ctx.font = `normal ${footerFontSize}px "Inter", sans-serif`;
    const footerTextY = footerY + Math.round(footerH * 0.6);

    // left: location (WORKING_ADDRESS), center: email, right: phone
    ctx.textAlign = "left";
    const leftText = WORKING_ADDRESS || "Address not provided";
    ctx.fillText(leftText, footerX + footerPadding, footerTextY);

    ctx.textAlign = "center";
    const centerText = EMAIL || "email@domain.tld";
    ctx.fillText(centerText, footerX + Math.round(footerW / 2), footerTextY);

    ctx.textAlign = "right";
    const rightText = PHONE_NUMBER || "Phone: N/A";
    ctx.fillText(rightText, footerX + footerW - footerPadding, footerTextY);

    // Body area (between header and footer)
    const bodyTop = headerY + headerH + Math.round(innerH * 0.02);
    const bodyBottom = footerY - Math.round(innerH * 0.02);
    const bodyH = bodyBottom - bodyTop;
    const bodyX = innerX + innerMargin;
    const bodyW = innerW - innerMargin * 2;

    // Two-column: avatar left, text right
    const leftColW = Math.round(bodyW * 0.35);
    const rightColW = bodyW - leftColW - Math.round(bodyW * 0.03);
    const leftColX = bodyX;
    const rightColX = bodyX + leftColW + Math.round(bodyW * 0.03);

    // Load avatar
    let avatarImg: any = null;
    try {
      const photoUrl = member.passportPhotoUrl ?? "";
      if (photoUrl && photoUrl.startsWith("/")) {
        const imgPath = path.join(process.cwd(), "public", photoUrl);
        if (fs.existsSync(imgPath)) avatarImg = await loadImage(imgPath);
      } else if (photoUrl && photoUrl.startsWith("http")) {
        avatarImg = await loadImage(photoUrl);
      }
    } catch (e) {
      avatarImg = null;
    }

    const avatarMaxH = Math.round(bodyH * 0.6);
    const avatarSize = Math.round(Math.min(leftColW * 0.9, avatarMaxH));
    const avatarCX = leftColX + Math.round(leftColW / 2);
    const avatarCY = bodyTop + Math.round(bodyH / 2);

    // white circle background for avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarSize / 2 + 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // clipped avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (avatarImg) {
      const scale = Math.max(avatarSize / avatarImg.width, avatarSize / avatarImg.height);
      const sw = avatarSize / scale;
      const sh = avatarSize / scale;
      const sx = Math.max(0, (avatarImg.width - sw) / 2);
      const sy = Math.max(0, (avatarImg.height - sh) / 2);
      ctx.drawImage(avatarImg, sx, sy, sw, sh, avatarCX - avatarSize / 2, avatarCY - avatarSize / 2, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = "#ddd";
      ctx.fillRect(avatarCX - avatarSize / 2, avatarCY - avatarSize / 2, avatarSize, avatarSize);
      ctx.fillStyle = "#aaa";
      ctx.textAlign = "center";
      ctx.font = `${Math.round(avatarSize * 0.12)}px "Inter", sans-serif`;
      ctx.fillText("No Photo", avatarCX, avatarCY + 6);
    }
    ctx.restore();

    // avatar stroke
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarSize / 2 + 6, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0d6efd";
    ctx.stroke();

    // Right column text (left aligned)
    let ty = bodyTop + Math.round(bodyH * 0.18);
    ctx.textAlign = "left";
    ctx.fillStyle = "#111";
    ctx.font = `bold ${Math.round(bodyH * 0.12)}px "Inter", sans-serif`;
    ctx.fillText(member.name ?? "Unknown", rightColX, ty);
    ty += Math.round(bodyH * 0.12) + 6;

    ctx.font = `normal ${Math.round(bodyH * 0.065)}px "Inter", sans-serif`;
    ctx.fillStyle = "#333";
    ctx.fillText(`Member Code: ${member.memberCode}`, rightColX, ty);
    ty += Math.round(bodyH * 0.08);

    const categoryName = member.category?.name ?? "—";
    const coverage = member.category?.coveragePercent ? `${member.category.coveragePercent}%` : "—";
    ctx.fillText(`Category: ${categoryName} (${coverage})`, rightColX, ty);
    ty += Math.round(bodyH * 0.08);

    if (member.company?.name) {
      ctx.fillText(`Company: ${member.company.name}`, rightColX, ty);
      ty += Math.round(bodyH * 0.08);
    }

    if (member.isDependent) {
      const depOf = await dependentOf(member.memberCode);
      ctx.fillStyle = "#b71c1c";
      ctx.font = `bold ${Math.round(bodyH * 0.07)}px "Inter", sans-serif`;
      const depText = depOf ? `Dependent of: ${depOf.name}` : `Dependent`;
      ctx.fillText(depText, rightColX, ty);
      ty += Math.round(bodyH * 0.09);
      ctx.fillStyle = "#333";
      ctx.font = `normal ${Math.round(bodyH * 0.065)}px "Inter", sans-serif`;
    }

    // subtle watermark inside inner area
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.font = `normal ${Math.round(footerH * 0.18)}px "Inter", sans-serif`;
    ctx.fillText("Generated by YourSystem", innerX + innerMargin, footerY - Math.round(footerH * 0.25));

    // Export and save
    const buffer = canvas.toBuffer("image/png");
    const safeName = `${member.memberCode}_${member.name}`.replace(/[\/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_");
    const filename = `card_${safeName}.png`;

    const saved = await saveBufferToStorage(filename, buffer);
    const returnedUrl = typeof saved === "string" ? saved : (saved && (saved.url ?? saved.filepath ?? saved.filePath)) ?? null;
    if (!returnedUrl) {
      console.error("saveBufferToStorage returned unexpected value:", saved);
      return NextResponse.json({ error: "Failed saving file" }, { status: 500 });
    }

    return NextResponse.json({ url: returnedUrl }, { status: 200 });
  } catch (err) {
    console.error("card generation error:", err);
    return NextResponse.json({ error: "Server error generating card" }, { status: 500 });
  } finally {
    // keep Prisma pooling; don't disconnect here
  }
}
