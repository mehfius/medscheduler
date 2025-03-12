const supabase = require('../config/supabase');
const { sendResponse } = require('../utils/responseHandler');

const scheduleAppointment = async (req, res) => {
    const { doctor_uuid, patient_uuid, date, time } = req.body;

    const appointment_datetime = new Date(`${date}T${time}`);
    const weekday = appointment_datetime.getDay();

    const availability = await supabase
        .schema('medscheduler')
        .from('availabilities')
        .select('*')
        .eq('doctor_id', doctor_uuid)
        .eq('weekday', weekday)
        .single();

    if (!availability.data) {
        return sendResponse(res, 400, 'DOCTOR_NOT_AVAILABLE', 'Doctor not available on this day');
    }

    const slot_available = await supabase
        .schema('medscheduler')
        .from('available_slots')
        .select('*')
        .eq('doctor_id', doctor_uuid)
        .eq('date', date)
        .eq('time', time)
        .eq('reserved', false)
        .single();

    if (!slot_available.data) {
        return sendResponse(res, 400, 'SLOT_NOT_AVAILABLE', 'Time slot not available');
    }

    const { data, error } = await supabase
        .schema('medscheduler')
        .from('appointments')
        .insert([
            {
                doctor_id: doctor_uuid,
                patient_id: patient_uuid,
                date: date,
                time: time
            }
        ]);

    if (error) throw error;

    await supabase
        .schema('medscheduler')
        .from('available_slots')
        .update({ reserved: true })
        .eq('id', slot_available.data.id);

    return sendResponse(res, 200, 'APPOINTMENT_SCHEDULED', 'Appointment scheduled successfully', {
        appointment_id: data[0].id
    });
};

module.exports = { scheduleAppointment }; 