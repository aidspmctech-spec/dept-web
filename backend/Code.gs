/**
 * Code.gs
 * Entry point for the Google Apps Script Web App
 */

function doGet(e) {
  return HtmlService.createHtmlOutput("AIDS Backend is running. Please use POST requests via the frontend.");
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const token = request.token;
    const payload = request.payload || {};

    // 1. Dispatch to specific module
    const response = dispatch(action, token, payload);

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      error: 'Internal Server Error',
      details: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Central dispatcher to route actions to appropriate functions
 */
function dispatch(action, token, payload) {
  // Public actions (no token required)
  if (action === 'login') {
    return Auth.login(payload);
  }

  // Protected actions (token required)
  const session = Auth.validateSession(token);
  if (!session) {
    return { status: 'error', error: 'Unauthorized', message: 'Invalid or expired session' };
  }

  // Authorization check: Role-based access
  if (!Auth.authorize(session.role, action)) {
    return { status: 'error', error: 'Forbidden', message: 'You do not have permission to perform this action' };
  }

  // Route to specific modules
  switch (action) {
    case 'getStudentProfile':
      return Students.getProfile(session.registerNo, payload);
    case 'getStudentFees':
      return Fees.getStudentFees(session.registerNo, payload);
    case 'getStudentPayments':
      return Payments.getStudentPayments(session.registerNo, payload);
    case 'submitPayment':
      return Payments.submitPayment(session.registerNo, payload);
    case 'checkOnboarding':
      return Onboarding.checkStatus(session.registerNo);
    case 'completeOnboarding':
      return Onboarding.complete(session.registerNo, payload);
    case 'getStudentAchievements':
      return Achievements.getStudentAchievements(session.registerNo, payload);
    case 'submitAchievement':
      return Achievements.submitAchievement(session.registerNo, payload);
    case 'getStudentCertifications':
      return Certifications.getStudentCertifications(session.registerNo, payload);
    case 'submitCertification':
      return Certifications.submitCertification(session.registerNo, payload);
    case 'getVerificationQueue':
      return Achievements.getVerificationQueue();
    case 'verifyAchievement':
      return Achievements.verifyAchievement(payload);
    case 'getCertificationQueue':
      return Certifications.getVerificationQueue();
    case 'verifyCertification':
      return Certifications.verifyCertification(payload);
    case 'getDashboardStats':
      return Reports.getDashboardStats();
    case 'getPendingFeesReport':
      return Reports.getPendingFeesReport();
    case 'getAuditLogs':
      return Audit.getLogs(payload);
    case 'logout':
      return Auth.logout(token);
    // Additional actions will be added in subsequent phases
    default:
      return { status: 'error', error: 'Not Found', message: 'Action not implemented' };
  }
}
