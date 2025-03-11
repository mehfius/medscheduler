const functions = require('@google-cloud/functions-framework');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

functions.http('medscheduler', async (req, res) => {
    try {
        const { action, doctor_uuid, patient_uuid, date, time, start_date, end_date } = req.body;

        if (!action || !doctor_uuid) {
            return res.status(400).json({
                code: 'MISSING_REQUIRED_PARAMETERS',
                message: 'Action and doctor_uuid are required'
            });
        }

        if (action === 'generate_slots') {
            if (!start_date || !end_date) {
                return res.status(400).json({
                    code: 'MISSING_SLOT_PARAMETERS',
                    message: 'start_date and end_date are required for generating slots'
                });
            }

            const availability = await supabase
                .from('medscheduler.availabilities')
                .select('*')
                .eq('doctor_id', doctor_uuid);

            if (!availability.data || availability.data.length === 0) {
                return res.status(400).json({
                    code: 'DOCTOR_AVAILABILITY_NOT_FOUND',
                    message: 'Doctor availability not found'
                });
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

            const { data, error } = await supabase
                .from('medscheduler.available_slots')
                .insert(slots);

            if (error) throw error;

            return res.status(200).json({
                code: 'SLOTS_GENERATED',
                message: 'Slots generated successfully',
                data: {
                    slots_generated: slots.length
                }
            });
        }
        else if (action === 'schedule_appointment') {
            if (!patient_uuid || !date || !time) {
                return res.status(400).json({
                    code: 'MISSING_APPOINTMENT_PARAMETERS',
                    message: 'patient_uuid, date, and time are required for scheduling'
                });
            }

            const appointment_datetime = new Date(`${date}T${time}`);
            const weekday = appointment_datetime.getDay();

            const availability = await supabase
                .from('medscheduler.availabilities')
                .select('*')
                .eq('doctor_id', doctor_uuid)
                .eq('weekday', weekday)
                .single();

            if (!availability.data) {
                return res.status(400).json({
                    code: 'DOCTOR_NOT_AVAILABLE',
                    message: 'Doctor not available on this day'
                });
            }

            const slot_available = await supabase
                .from('medscheduler.available_slots')
                .select('*')
                .eq('doctor_id', doctor_uuid)
                .eq('date', date)
                .eq('time', time)
                .eq('reserved', false)
                .single();

            if (!slot_available.data) {
                return res.status(400).json({
                    code: 'SLOT_NOT_AVAILABLE',
                    message: 'Time slot not available'
                });
            }

            const { data, error } = await supabase
                .from('medscheduler.appointments')
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
                .from('medscheduler.available_slots')
                .update({ reserved: true })
                .eq('id', slot_available.data.id);

            return res.status(200).json({
                code: 'APPOINTMENT_SCHEDULED',
                message: 'Appointment scheduled successfully',
                data: {
                    appointment_id: data[0].id
                }
            });
        }
        else {
            return res.status(400).json({
                code: 'INVALID_ACTION',
                message: 'Invalid action specified'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        });
    }
});
