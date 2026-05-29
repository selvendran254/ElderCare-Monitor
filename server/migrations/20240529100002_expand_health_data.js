exports.up = async function (knex) {
  await knex.schema.alterTable('vitals', (table) => {
    table.decimal('spo2', 5, 1);
    table.decimal('temperature', 4, 1);
    table.decimal('blood_glucose', 6, 1);
    table.string('glucose_type', 20);
    table.integer('respiratory_rate');
    table.decimal('weight_kg', 5, 1);
    table.integer('pain_level');
    table.string('mood', 50);
    table.integer('hydration_glasses');
    table.string('recorded_by', 50);
    table.string('source', 50).defaultTo('manual');
  });

  await knex.schema.alterTable('medications', (table) => {
    table.string('medicine_type', 50);
    table.string('food_timing', 50);
    table.jsonb('schedule_times').defaultTo('[]');
    table.string('prescribed_by', 255);
    table.string('pharmacy', 255);
    table.date('refill_date');
    table.integer('stock_remaining');
    table.text('side_effects');
    table.text('reason');
    table.string('photo_url', 500);
  });

  await knex.schema.alterTable('activities', (table) => {
    table.integer('water_intake_ml');
    table.integer('exercise_minutes');
    table.integer('outdoor_minutes');
    table.integer('social_interactions');
    table.integer('screen_time_minutes');
    table.integer('bathroom_visits');
    table.boolean('fall_detected').defaultTo(false);
    table.string('location', 255);
    table.string('weather', 100);
    table.integer('calories_burned');
    table.decimal('nap_hours', 4, 1);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('activities', (table) => {
    table.dropColumns('water_intake_ml', 'exercise_minutes', 'outdoor_minutes', 'social_interactions', 'screen_time_minutes', 'bathroom_visits', 'fall_detected', 'location', 'weather', 'calories_burned', 'nap_hours');
  });
  await knex.schema.alterTable('medications', (table) => {
    table.dropColumns('medicine_type', 'food_timing', 'schedule_times', 'prescribed_by', 'pharmacy', 'refill_date', 'stock_remaining', 'side_effects', 'reason', 'photo_url');
  });
  await knex.schema.alterTable('vitals', (table) => {
    table.dropColumns('spo2', 'temperature', 'blood_glucose', 'glucose_type', 'respiratory_rate', 'weight_kg', 'pain_level', 'mood', 'hydration_glasses', 'recorded_by', 'source');
  });
};
