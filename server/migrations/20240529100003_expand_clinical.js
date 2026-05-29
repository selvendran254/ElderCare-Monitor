exports.up = async function (knex) {
  await knex.schema.alterTable('appointments', (table) => {
    table.string('appointment_type', 100);
    table.string('video_call_link', 500);
    table.text('prescription');
    table.text('treatment_plan');
    table.date('next_review_date');
    table.string('referral_to', 255);
    table.integer('visit_duration_minutes');
    table.string('diagnosis_code', 50);
    table.jsonb('vitals_at_visit');
  });

  await knex.schema.createTable('lab_results', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.integer('appointment_id').unsigned().references('id').inTable('appointments').onDelete('SET NULL');
    table.string('test_name', 255).notNullable();
    table.string('result_value', 100);
    table.string('unit', 50);
    table.string('reference_range', 100);
    table.string('status', 50);
    table.string('file_url', 500);
    table.timestamp('tested_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('prescriptions', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.integer('doctor_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('appointment_id').unsigned().references('id').inTable('appointments').onDelete('SET NULL');
    table.string('medicine_name', 255);
    table.string('dosage', 100);
    table.string('frequency', 100);
    table.integer('duration_days');
    table.text('instructions');
    table.timestamp('prescribed_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('prescriptions');
  await knex.schema.dropTableIfExists('lab_results');
};
