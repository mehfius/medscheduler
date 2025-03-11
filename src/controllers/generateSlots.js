const supabase = require('../config/supabase');
const { sendResponse } = require('../utils/responseHandler');

const generateSlots = async (req, res) => {
    const { doctor_uuid, start_date, end_date } = req.body;

    const availability = await supabase
        .from('medscheduler.availabilities')
        .select('*')
        .eq('doctor_id', doctor_uuid);

    if (!availability.data || availability.data.length === 0) {
        return sendResponse(res, 400, 'DOCTOR_AVAILABILITY_NOT_FOUND', 'Doctor availability not found');
    }

    const holidays = await supabase
        .from('medscheduler.holidays')
        .select('date')
        .gte('date', start_date)
        .lte('date', end_date);

    const slots = [];
    const current_date = new Date(start_date);
    const end_date_obj = new Date(end_date);

    while (current_date <= end_date_obj) {
        const weekday = current_date.getDay();
        const day_availability = availability.data.find(a => a.weekday === weekday);

        if (day_availability && !holidays.data.some(h => h.date === current_date.toISOString().split('T')[0])) {
            const start_time = new Date(`${current_date.toISOString().split('T')[0]}T${day_availability.start_time}`);
            const end_time = new Date(`${current_date.toISOString().split('T')[0]}T${day_availability.end_time}`);
            const duration = day_availability.consultation_duration;

            let current_time = start_time;
            while (current_time < end_time) {
                slots.push({
                    doctor_id: doctor_uuid,
                    date: current_date.toISOString().split('T')[0],
                    time: current_time.toTimeString().split(' ')[0],
                    reserved: false
                });
                current_time = new Date(current_time.getTime() + duration * 60000);
            }
        }
        current_date.setDate(current_date.getDate() + 1);
    }

    const { error } = await supabase
        .from('medscheduler.available_slots')
        .insert(slots);

    if (error) throw error;

    return sendResponse(res, 200, 'SLOTS_GENERATED', 'Slots generated successfully', {
        slots_generated: slots.length
    });
};

module.exports = { generateSlots }; 