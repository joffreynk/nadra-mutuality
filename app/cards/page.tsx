// pages/api/card.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Optional: register a font placed at public/fonts/Inter-Regular.ttf
const FONT_REGULAR = path.join(process.cwd(), "public", "fonts", "Inter-Regular.ttf");
const FONT_BOLD = path.join(process.cwd(), "public", "fonts", "Inter-Bold.ttf");
if (fs.existsSync(FONT_REGULAR)) registerFont(FONT_REGULAR, { family: "Inter", weight: "400" });
if (fs.existsSync(FONT_BOLD)) registerFont(FONT_BOLD, { family: "Inter", weight: "700" });

// Driving license size (ID-1): ~85.6mm × 53.98mm. We use ~1012 x 640 px (~300dpi equivalent).
const WIDTH = 1012;
const HEIGHT = 640;

function dependentOf(memberCode?: string) {
  if (!memberCode) return null;
  if (memberCode.includes("/")) return memberCode.split("/")[0];
  return null;
}

async function findMember({ id, memberCode }: { id?: string; memberCode?: string }) {
  if (id) {
    return prisma.member.findUnique({
      where: { id },
      include: { category: true, company: true },
    });
  }
  if (memberCode) {
    return prisma.member.findFirst({
      where: { memberCode },
      include: { category: true, company: true },
    });
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { memberCode, id } = req.query as { memberCode?: string; id?: string };

    if (!memberCode && !id) {
      return res.status(400).json({ error: "Provide ?memberCode=... or ?id=... (selected member identifier)." });
    }

    const member = await findMember({ id, memberCode });
    if (!member) return res.status(404).json({ error: "Member not found" });

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // --- Background ---
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // --- Header (red) ---
    const headerH = Math.round(HEIGHT * 0.18); // header height
    ctx.fillStyle = "#c62828"; // red header
    ctx.fillRect(0, 0, WIDTH, headerH);

    // --- Logo reserved box on the left inside header ---
    const logoBoxSize = Math.round(headerH * 0.8);
    const logoBoxX = Math.round(WIDTH * 0.03);
    const logoBoxY = Math.round((headerH - logoBoxSize) / 2);
    ctx.fillStyle = "#ffffff10"; // subtle bg for logo box
    ctx.fillRect(logoBoxX - 6, logoBoxY - 6, logoBoxSize + 12, logoBoxSize + 12);

    // Try to load a logo at /public/logo.png (optional)
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logo = await loadImage(logoPath);
        // fit into box preserving aspect
        const scale = Math.min(logoBoxSize / logo.width, logoBoxSize / logo.height);
        const lw = logo.width * scale;
        const lh = logo.height * scale;
        ctx.drawImage(logo as any, logoBoxX + (logoBoxSize - lw) / 2, logoBoxY + (logoBoxSize - lh) / 2, lw, lh);
      } else {
        // placeholder
        ctx.fillStyle = "#fff";
        ctx.fillRect(logoBoxX + 8, logoBoxY + 8, logoBoxSize - 16, logoBoxSize - 16);
      }
    } catch (err) {
      // ignore logo errors
    }

    // --- Insurance name centered in header (white text) ---
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(headerH * 0.33)}px "Inter", sans-serif`;
    const insuranceName = "INSURANCE NAME"; // replace or inject dynamically if you want
    ctx.fillText(insuranceName, WIDTH / 2 + 40, Math.round(headerH / 2 + (headerH * 0.1)));

    // --- Main body layout ---
    // Left: avatar + small details on left band
    const leftBandW = Math.round(WIDTH * 0.36);
    // subtle left band background
    ctx.fillStyle = "#f7f7f7";
    ctx.fillRect(0, headerH, leftBandW, HEIGHT - headerH - Math.round(HEIGHT * 0.12));

    // Avatar circle
    const avatarSize = Math.round(Math.min(leftBandW * 0.7, HEIGHT * 0.45));
    const avatarX = Math.round((leftBandW) / 2);
    const avatarY = headerH + Math.round((HEIGHT - headerH) * 0.25);

    // Load passport photo (supports /uploads/... under public or full URL)
    let avatarImg: any = null;
    try {
      const photoUrl = member.passportPhotoUrl ?? "";
      if (photoUrl.startsWith("/")) {
        const imgPath = path.join(process.cwd(), "public", photoUrl);
        if (fs.existsSync(imgPath)) avatarImg = await loadImage(imgPath);
      } else if (photoUrl.startsWith("http")) {
        avatarImg = await loadImage(photoUrl);
      }
    } catch (e) {
      avatarImg = null;
    }

    // draw circular avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (avatarImg) {
      // center-crop
      const scale = Math.max(avatarSize / avatarImg.width, avatarSize / avatarImg.height);
      const sw = avatarSize / scale;
      const sh = avatarSize / scale;
      const sx = Math.max(0, (avatarImg.width - sw) / 2);
      const sy = Math.max(0, (avatarImg.height - sh) / 2);
      ctx.drawImage(avatarImg, sx, sy, sw, sh, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    } else {
      // placeholder circle
      ctx.fillStyle = "#ddd";
      ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.fillStyle = "#aaa";
      ctx.font = `${Math.round(avatarSize * 0.12)}px "Inter", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("No Photo", avatarX, avatarY + 6);
    }
    ctx.restore();

    // draw border around avatar
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 6, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // --- Right side: textual info ---
    ctx.textAlign = "left";
    const rightX = leftBandW + Math.round(WIDTH * 0.04);
    let y = headerH + Math.round(HEIGHT * 0.14);

    ctx.fillStyle = "#111";
    ctx.font = `bold ${Math.round(HEIGHT * 0.09)}px "Inter", sans-serif`; // big name
    ctx.fillText(member.name ?? "Unknown", rightX, y);
    y += Math.round(HEIGHT * 0.12);

    ctx.font = `normal ${Math.round(HEIGHT * 0.05)}px "Inter", sans-serif`;
    ctx.fillStyle = "#333";
    ctx.fillText(`Member Code: ${member.memberCode}`, rightX, y);
    y += Math.round(HEIGHT * 0.075);

    const categoryName = member.category?.name ?? "—";
    ctx.fillText(`Category: ${categoryName}`, rightX, y);
    y += Math.round(HEIGHT * 0.075);

    if (member.company?.name) {
      ctx.fillText(`Company: ${member.company.name}`, rightX, y);
      y += Math.round(HEIGHT * 0.075);
    }

    // Dependent handling (explicit note)
    const depOf = dependentOf(member.memberCode);
    if (member.isDependent || depOf) {
      ctx.fillStyle = "#b71c1c"; // dark red for emphasis
      ctx.font = `bold ${Math.round(HEIGHT * 0.05)}px "Inter", sans-serif`;
      const depText = depOf ? `Dependent of: ${depOf}` : `Dependent (${member.familyRelationship ?? "—"})`;
      ctx.fillText(depText, rightX, y);
      y += Math.round(HEIGHT * 0.09);
      ctx.fillStyle = "#333";
      ctx.font = `normal ${Math.round(HEIGHT * 0.045)}px "Inter", sans-serif`;
    }

    // Reserve small barcode / QR area bottom-right (visual)
    const qrW = Math.round(WIDTH * 0.20);
    const qrH = Math.round((HEIGHT - headerH) * 0.18);
    const qrX = WIDTH - qrW - Math.round(WIDTH * 0.04);
    const qrY = HEIGHT - Math.round(HEIGHT * 0.12) - qrH - 10;
    ctx.fillStyle = "#efefef";
    ctx.fillRect(qrX, qrY, qrW, qrH);
    ctx.fillStyle = "#999";
    ctx.font = `${Math.round(qrH * 0.18)}px "Inter", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("QR/Barcode", qrX + qrW / 2, qrY + qrH / 2 + 8);
    ctx.textAlign = "left";

    // --- Footer stripe (dark gray) ---
    const footerH = Math.round(HEIGHT * 0.12);
    const footerY = HEIGHT - footerH;
    ctx.fillStyle = "#2f2f2f";
    ctx.fillRect(0, footerY, WIDTH, footerH);

    // Footer texts: working address and phone number (you can change values or pull from org)
    const footerPadding = Math.round(WIDTH * 0.04);
    ctx.fillStyle = "#ffffff";
    ctx.font = `normal ${Math.round(footerH * 0.28)}px "Inter", sans-serif`;
    const workingAddress = member.company?.address ?? "Organization working address";
    const phone = member.company?.phoneNumber ?? "Phone: 000000000";
    ctx.fillText(workingAddress, footerPadding, footerY + Math.round(footerH * 0.45));
    ctx.textAlign = "right";
    ctx.fillText(phone, WIDTH - footerPadding, footerY + Math.round(footerH * 0.45));

    // --- small watermark/text bottom-left ---
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff5";
    ctx.font = `normal ${Math.round(footerH * 0.18)}px "Inter", sans-serif`;
    ctx.fillText("Generated by YourSystem", footerPadding, footerY + Math.round(footerH * 0.9));

    // --- export PNG ---
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="dl-card-${member.memberCode}.png"`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error("card generation error:", err);
    res.status(500).json({ error: "Server error generating card" });
  } finally {
    // do not disconnect prisma here in serverless environments; keep connection pooling
  }
}
