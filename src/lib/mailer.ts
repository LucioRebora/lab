import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const generateBudgetHTML = (budget: any): string => {
  const itemsHtml = budget.items
    .map(
      (item: any) => `
    <tr style="border-bottom: 1px solid #edf2f7;">
      <td style="padding: 12px; font-size: 14px; color: #2d3748; font-weight: 500;">${item.nombre}</td>
      <td style="padding: 12px; font-size: 14px; color: #2d3748; text-align: right; font-weight: bold;">$${item.valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #2d3748; background-color: #f8fafc; margin: 0;">
      <div style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #edf2f7;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #1a202c; padding-bottom: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align: top; width: 33%;">
                <img src="https://www.lblab.com.ar/img/logo-lblab.png" style="height: 70px;" alt="LB Lab">
              </td>
              <td style="vertical-align: top; text-align: center; width: 34%; font-size: 10px; color: #718096; line-height: 1.4;">
                <p style="margin: 0;"><strong>Dirección:</strong> Bolivar 1002</p>
                <p style="margin: 0;"><strong>Teléfono:</strong> 3446 - 434574</p>
                <p style="margin: 0;"><strong>Whatsapp:</strong> 3446 - 330365</p>
                <p style="margin: 0;"><strong>E-mail:</strong> laboratorio@lblab.com.ar</p>
                <p style="margin: 0;"><strong>Web:</strong> www.lblab.com.ar</p>
              </td>
              <td style="vertical-align: top; text-align: right; width: 33%; line-height: 1.4;">
                <h1 style="margin: 0; font-size: 20px; color: #1a202c; text-transform: uppercase; letter-spacing: 1px;">PRESUPUESTO</h1>
                <p style="margin: 2px 0 0; font-size: 10px; color: #718096;"><strong>Fecha de emisión:</strong> ${new Date(budget.createdAt).toLocaleDateString('es-AR')} ${new Date(budget.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p>
              </td>
            </tr>
          </table>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #edf2f7;">
          <tr>
            <td style="padding: 15px; font-size: 13px; border: 1px solid #edf2f7; width: 50%;"><strong>Paciente:</strong> ${budget.paciente || "-"}</td>
            <td style="padding: 15px; font-size: 13px; border: 1px solid #edf2f7; width: 50%;"><strong>Teléfono:</strong> ${budget.telefono || "-"}</td>
          </tr>
          <tr>
            <td style="padding: 15px; font-size: 13px; border: 1px solid #edf2f7;"><strong>Email:</strong> ${budget.email || "-"}</td>
            <td style="padding: 15px; font-size: 13px; border: 1px solid #edf2f7;"><strong>Obra Social:</strong> ${budget.healthInsuranceNombre || "Personalizada"}</td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="background: #1a202c; color: white; padding: 12px; font-size: 12px; text-transform: uppercase; text-align: left;">Estudio / Análisis Clínico</th>
              <th style="background: #1a202c; color: white; padding: 12px; font-size: 12px; text-transform: uppercase; text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <div style="display: inline-block; background: #1a202c; color: white; padding: 20px 40px; border-radius: 8px; text-align: center;">
            <span style="font-size: 14px; opacity: 0.8;">TOTAL</span><br>
            <span style="font-size: 28px; font-weight: bold;">$${budget.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div style="margin-top: 60px; border-top: 1px solid #edf2f7; padding-top: 20px; font-size: 11px; color: #718096; line-height: 1.6; text-align: center;">
          <p style="margin: 2px 0;">• Este presupuesto tiene validez por 30 días.</p>
          <p style="margin: 2px 0;">• Los valores incluyen IVA.</p>
          <p style="margin: 2px 0;">• Los precios están sujetos a modificaciones sin previo aviso.</p>
          <p style="margin: 2px 0;">• La atención domiciliaria incluye viáticos según zona.</p>
          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;">
          <p style="font-weight: bold; margin: 0; color: #1a202c;">LB LAB – Comprometidos con la calidad y la seguridad en Análisis Clínicos</p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

export const sendBudgetEmail = async (budget: any) => {
  if (!budget.email) throw new Error("El presupuesto no tiene un email de destino.");

  // Enviamos directamente el HTML como cuerpo del correo en lugar de adjuntarlo
  const htmlContent = generateBudgetHTML(budget);

  return transporter.sendMail({
    from: `"LB Lab" <${process.env.GMAIL_USER}>`,
    to: budget.email,
    subject: `Presupuesto de Análisis Clínicos - ${budget.paciente || "LB Lab"}`,
    html: htmlContent, // Cuerpo del mail = Diseño premium
  });
};
