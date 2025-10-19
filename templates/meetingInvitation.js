/*
 * File: meetingInvitation.js
 * Description: Generates a beautiful HTML email template for meeting invitations, including agenda, details, and join link.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

/**
 * Generate a meeting invitation email template.
 * @param {Object} params - Meeting details
 * @param {string} params.clientName - Name of the invitee
 * @param {string} params.title - Meeting title
 * @param {string} params.description - Meeting description
 * @param {string|Date} params.dateTime - Meeting date and time
 * @param {string} params.duration - Meeting duration
 * @param {string} params.locationType - 'virtual' or physical
 * @param {string} params.location - Physical location (if applicable)
 * @param {string} params.platform - Meeting platform (e.g., 'meet', 'zoom')
 * @param {string} params.meetingLink - Join link for virtual meetings
 * @param {string} params.agenda - Agenda as a newline-separated string
 * @param {string} params.schedulerName - Name of the scheduler
 * @param {string} [params.schedulerPosition] - Position of the scheduler (optional)
 * @returns {string} - HTML email template
 */
const getEmailTemplate = ({
  clientName,
  title,
  description,
  dateTime,
  duration,
  locationType,
  location,
  platform,
  meetingLink,
  agenda,
  schedulerName,
  schedulerPosition = ''
}) => {
  // Format the date and time for display
  const formattedDateTime = new Date(dateTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Split agenda into items for display
  const agendaItems = agenda ? agenda.split('\n').filter(item => item.trim()) : [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Invitation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-container {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 25px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            background-color: #fff;
            padding: 25px;
        }
        .meeting-details {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .meeting-item {
            margin-bottom: 15px;
        }
        .meeting-label {
            font-weight: 600;
            color: #2980b9;
            margin-bottom: 5px;
            display: block;
        }
        .meeting-value {
            margin: 0;
        }
        .agenda-item {
            margin-bottom: 10px;
            display: flex;
        }
        .agenda-icon {
            margin-right: 10px;
            color: #2980b9;
        }
        .button {
            display: inline-block;
            background-color: #2980b9;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 500;
            margin: 15px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #3498db;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        ul {
            padding-left: 20px;
        }
        @media screen and (max-width: 480px) {
            .header h1 {
                font-size: 20px;
            }
            .content {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Meeting Invitation</h1>
        </div>
        
        <div class="content">
            <p>Hello ${clientName},</p>
            
            <p>I hope this email finds you well. I'd like to invite you to an upcoming meeting to discuss ${description}.</p>
            
            <div class="meeting-details">
                <div class="meeting-item">
                    <span class="meeting-label">Meeting Title</span>
                    <p class="meeting-value">${title}</p>
                </div>
                
                <div class="meeting-item">
                    <span class="meeting-label">Date & Time</span>
                    <p class="meeting-value">${formattedDateTime}</p>
                </div>
                
                <div class="meeting-item">
                    <span class="meeting-label">Duration</span>
                    <p class="meeting-value">${duration}</p>
                </div>
                
                <div class="meeting-item">
                    <span class="meeting-label">Location</span>
                    <p class="meeting-value">
                        ${locationType === 'virtual' 
                          ? `Virtual Meeting (${platform === 'meet' ? 'Google Meet' : 'Zoom'})`
                          : location}
                    </p>
                </div>
            </div>
            
            ${locationType === 'virtual' ? `
            <a href="${meetingLink}" class="button">Join Meeting</a>
            ` : ''}
            
            ${agenda ? `
            <div class="meeting-item">
                <span class="meeting-label">Meeting Agenda</span>
                <ul>
                    ${agendaItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <p>Please let me know if you have any questions or if you'd like to suggest additional agenda items before our meeting.</p>
            
            <p>Looking forward to our conversation!</p>
            
            <p>Best regards,<br>${schedulerName}${schedulerPosition ? `<br>${schedulerPosition}` : ''}</p>
        </div>
        
        <div class="footer">
            <p>This is a calendar invitation. Please add it to your calendar.</p>
            <p>If you're unable to attend, please let me know as soon as possible.</p>
        </div>
    </div>
</body>
</html>
  `;
};

module.exports = getEmailTemplate;

/*
 * End of meetingInvitation.js
 * Description: End of meeting invitation template file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 