const fs = require('fs');

function truncate(text, len = 120) {
  if (!text) return '';
  if (text.length <= len) return text;
  return text.slice(0, len - 1) + '…';
}

function drawAvatar(doc, x, y, size, avatarPath, initials) {
  const radius = size / 2;
  try {
    if (avatarPath) {
      if (fs.existsSync(avatarPath)) {
        doc.save();
        // Draw avatar image
        doc.circle(x + radius, y + radius, radius).clip();
        doc.image(avatarPath, x, y, { width: size, height: size, fit: [size, size] });
        doc.restore();
        return;
      }
    }
  } catch (e) {
    // ignore and draw initials
  }

  // Draw initials in circle
  doc.save();
  doc.circle(x + radius, y + radius, radius).fill('#e6eef8');
  doc.fillColor('#0b84ff').fontSize(Math.floor(size / 2)).text(initials || '', x, y + size * 0.15, { width: size, align: 'center' });
  doc.restore();
}

function drawIconEnvelope(doc, x, y, size, color = '#6b7280') {
  doc.save();
  doc.rect(x, y, size, size * 0.6).strokeColor(color).stroke();
  doc.moveTo(x, y).lineTo(x + size / 2, y + size * 0.3).lineTo(x + size, y).stroke();
  doc.restore();
}

function drawIconPhone(doc, x, y, size, color = '#6b7280') {
  doc.save();
  doc.roundedRect(x, y, size * 0.7, size, 2).strokeColor(color).stroke();
  doc.restore();
}

function drawIconLocation(doc, x, y, size, color = '#6b7280') {
  doc.save();
  const cx = x + size / 2;
  doc.circle(cx, y + size / 3, size / 3).strokeColor(color).stroke();
  doc.moveTo(cx - size / 6, y + size / 2).lineTo(cx, y + size).lineTo(cx + size / 6, y + size / 2).stroke();
  doc.restore();
}

function drawSkillChip(doc, x, y, text) {
  const paddingX = 6;
  const paddingY = 3;
  const fontSize = 8;
  doc.fontSize(fontSize);
  const w = doc.widthOfString(text) + paddingX * 2;
  const h = fontSize + paddingY * 2;
  doc.roundedRect(x, y, w, h, 4).fillAndStroke('#f1f5f9', '#e2e8f0');
  doc.fillColor('#0f172a').text(text, x + paddingX, y + paddingY, { width: w - paddingX * 2, align: 'left' });
  return w + 6; // width including gap
}

function drawReadinessBadge(doc, x, y, score) {
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#ef4444';
  doc.save();
  doc.circle(x + 10, y + 10, 10).fill(color);
  doc.fillColor('#fff').fontSize(9).text(String(score), x + 4, y + 4);
  doc.restore();
}

function drawResumeCard(doc, app, x, y, w, h) {
  const padding = 10;
  const innerX = x + padding;
  let cursorY = y + padding;

  // Draw card background
  doc.roundedRect(x, y, w, h, 6).fillAndStroke('#ffffff', '#e6eef8');

  // Header: avatar, name and status
  drawAvatar(doc, innerX, cursorY, 50, app.student.avatar, `${app.student.firstName?.[0] || ''}${app.student.lastName?.[0] || ''}`);
  doc.fontSize(14).fillColor('#0b4cff').text(`${app.student.firstName} ${app.student.lastName}`, innerX + 60, cursorY + 6);

  // Status badge
  const statusText = app.status || 'Pending';
  const statusColor = statusText.toLowerCase().includes('selected') ? '#16a34a' : statusText.toLowerCase().includes('rejected') ? '#ef4444' : '#f59e0b';
  doc.rect(innerX + w - 140, cursorY + 6, 120, 20).fillAndStroke(statusColor, statusColor);
  doc.fillColor('#fff').fontSize(9).text(statusText, innerX + w - 140 + 8, cursorY + 10);

  cursorY += 60;

  // Contact row with icons
  const contactX = innerX;
  const contactY = cursorY;
  if (app.student.email) {
    drawIconEnvelope(doc, contactX, contactY, 12);
    doc.fontSize(9).fillColor('#374151').text(app.student.email, contactX + 18, contactY - 2);
  }
  if (app.student.phone) {
    drawIconPhone(doc, contactX + 180, contactY, 12);
    doc.fontSize(9).fillColor('#374151').text(app.student.phone, contactX + 200, contactY - 2);
  }
  if (app.student.studentProfile?.hometown?.district) {
    drawIconLocation(doc, contactX + 320, contactY, 12);
    const loc = `${app.student.studentProfile.hometown.district}, ${app.student.studentProfile.hometown.state}`;
    doc.fontSize(9).fillColor('#374151').text(loc, contactX + 340, contactY - 2);
  }

  cursorY += 22;

  // Columns: left facts, right summary
  const leftW = Math.floor((w - padding * 2) * 0.35);
  const rightW = w - padding * 2 - leftW - 10;

  // Left column
  let colY = cursorY;
  doc.fontSize(9).fillColor('#6b7280').text('Campus:', innerX, colY);
  doc.fillColor('#111827').text(app.student.campus?.name || '', innerX + 60, colY);
  colY += 14;

  const edu = (app.student.studentProfile?.higherEducation?.[0])
    ? `${app.student.studentProfile.higherEducation[0].degree} · ${app.student.studentProfile.higherEducation[0].endYear || ''}`
    : '';
  doc.fontSize(9).fillColor('#6b7280').text('Education:', innerX, colY);
  doc.fillColor('#111827').text(edu, innerX + 60, colY);
  colY += 14;

  doc.fontSize(9).fillColor('#6b7280').text('Applied:', innerX, colY);
  doc.fillColor('#111827').text(new Date(app.createdAt).toISOString().split('T')[0], innerX + 60, colY);
  colY += 20;

  // Job readiness if available
  const readinessScore = app.jobReadinessScore || 0;
  drawReadinessBadge(doc, innerX, colY, readinessScore);
  doc.fontSize(9).fillColor('#6b7280').text('Readiness', innerX + 30, colY + 2);

  // Right column: summary & skills
  const rightX = innerX + leftW + 10;
  let rightY = cursorY;

  const summary = truncate(app.student.studentProfile?.about || app.student.studentProfile?.currentModule || '', 160);
  doc.fontSize(10).fillColor('#111827').text(summary, rightX, rightY, { width: rightW });
  rightY += 34;

  // Skills as chips
  const skills = (app.student.studentProfile?.technicalSkills || []).slice(0, 6).map(s => s.skillName || s.skill?.name || s.skill);
  let sx = rightX;
  skills.forEach(skill => {
    const wChip = drawSkillChip(doc, sx, rightY, skill);
    sx += wChip;
    if (sx > rightX + rightW - 60) {
      sx = rightX;
      rightY += 18;
    }
  });

  // Footer: portfolio links
  let footerY = y + h - 30;
  doc.fontSize(9).fillColor('#6b7280').text('Portfolio:', innerX, footerY);
  const links = [app.student.studentProfile?.linkedIn, app.student.studentProfile?.github, app.student.studentProfile?.portfolio].filter(Boolean).join(' | ');
  doc.fontSize(9).fillColor('#0f172a').text(links, innerX + 60, footerY, { width: w - padding * 2 - 60 });
}

module.exports = {
  drawAvatar,
  drawIconEnvelope,
  drawIconPhone,
  drawIconLocation,
  drawSkillChip,
  drawReadinessBadge,
  drawResumeCard,
  truncate
};
