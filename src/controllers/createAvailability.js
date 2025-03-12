const supabase = require('../config/supabase');
const { sendResponse } = require('../utils/responseHandler');

const create_availability = async (req, res) => {
    const { doctor_uuid, weekday, start_time, end_time, consultation_duration } = req.body;

    if (!doctor_uuid || !weekday || !start_time || !end_time) {
        return sendResponse(res, 400, 'MISSING_REQUIRED_PARAMETERS', 'All fields are required');
    }

    try {
        // Check if availability already exists for this doctor and weekday
        const { data: existingAvailability, error: checkError } = await supabase
            .schema('medscheduler')
            .from('availabilities')
            .select('*')
            .eq('doctor_id', doctor_uuid)
            .eq('weekday', weekday)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // Ignore "not found" error
            console.error('Check Availability Error:', checkError);
            return sendResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Error checking existing availability');
        }

        if (existingAvailability) {
            return sendResponse(res, 400, 'AVAILABILITY_EXISTS', 'Availability already exists for this doctor and weekday');
        }

        const { data, error } = await supabase
            .schema('medscheduler')
            .from('availabilities')
            .insert([
                {
                    doctor_id: doctor_uuid,
                    weekday: weekday,
                    start_time: start_time,
                    end_time: end_time,
                    consultation_duration: consultation_duration || '30 minutes'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            return sendResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to create availability', {
                details: error
            });
        }

        if (!data) {
            return sendResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve created availability');
        }

        return sendResponse(res, 201, 'AVAILABILITY_CREATED', 'Availability created successfully', {
            availability_id: data.id
        });
    } catch (error) {
        console.error('Unexpected Error:', error);
        return sendResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
    }
};

module.exports = { create_availability }; 