import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.SMTP_HOST) {
      console.warn('SMTP no configurado - emails deshabilitados');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendDocumentExpiryAlert(employee, documentType, expiryDate) {
    if (!this.transporter) {
      console.log('Email service no disponible');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: employee.empl_email,
        subject: `Alerta: Documento ${documentType} próximo a vencer`,
        html: `
          <h2>Alerta de Documento</h2>
          <p>Estimado/a ${employee.empl_nombre_completo},</p>
          <p>Su documento de <strong>${documentType}</strong> vence el <strong>${expiryDate}</strong>.</p>
          <p>Por favor, renueve su documentación lo antes posible.</p>
          <br>
          <p>Saludos,<br>Equipo InnOut</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email enviado a ${employee.empl_email}`);
      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }

  async sendShiftNotification(employee, shiftDetails, action) {
    if (!this.transporter) return false;

    const subjects = {
      created: 'Nuevo turno asignado',
      cancelled: 'Turno cancelado',
      updated: 'Turno actualizado'
    };

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: employee.empl_email,
        subject: subjects[action] || 'Notificación de turno',
        html: `
          <h2>${subjects[action]}</h2>
          <p>Estimado/a ${employee.empl_nombre_completo},</p>
          <p>Su turno para el día <strong>${shiftDetails.fecha}</strong> ha sido ${action}.</p>
          <p>Detalles:</p>
          <ul>
            <li>Fecha: ${shiftDetails.fecha}</li>
            <li>Horario: ${shiftDetails.horaInicio} - ${shiftDetails.horaFin}</li>
            <li>Empresa: ${shiftDetails.empresa}</li>
            <li>Área: ${shiftDetails.area}</li>
          </ul>
          <br>
          <p>Saludos,<br>Equipo InnOut</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error enviando notificación de turno:', error);
      return false;
    }
  }
}

export default new EmailService();