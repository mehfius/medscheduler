const functions = require('@google-cloud/functions-framework');
const { generateSlots } = require('./controllers/generateSlots');
const { scheduleAppointment } = require('./controllers/scheduleAppointment');
const { sendResponse } = require('./utils/responseHandler');
const { create_availability } = require('./controllers/createAvailability');

functions.http('medscheduler', async (req, res) => {
    try {
        const { action } = req.body;

        if (!action) {
            return sendResponse(res, 400, 'MISSING_ACTION', 'Action is required');
        }

        switch (action) {
            case 'generate_slots':
                return await generateSlots(req, res);
            case 'schedule_appointment':
                return await scheduleAppointment(req, res);
            case 'create_availability':
                return await create_availability(req, res);
            default:
                return sendResponse(res, 400, 'INVALID_ACTION', 'Invalid action specified');
        }
    } catch (error) {
        console.error('Error:', error);
        return sendResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
    }
}); 