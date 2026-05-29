exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
  await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('elder', 'caretaker', 'doctor', 'admin', 'family'))`);

  await knex.schema.alterTable('users', (table) => {
    table.string('photo_url', 500);
    table.string('preferred_language', 10).defaultTo('en');
    table.boolean('dark_mode').defaultTo(false);
    table.timestamp('last_login');
  });

  await knex.schema.alterTable('elders', (table) => {
    table.date('date_of_birth');
    table.string('gender', 20);
    table.decimal('height_cm', 5, 1);
    table.decimal('weight_kg', 5, 1);
    table.decimal('bmi', 4, 1);
    table.jsonb('chronic_conditions').defaultTo('[]');
    table.jsonb('allergies').defaultTo('[]');
    table.string('mobility_status', 50);
    table.string('cognitive_status', 50);
    table.string('insurance_provider', 255);
    table.string('insurance_number', 100);
    table.string('preferred_hospital', 255);
    table.string('living_situation', 100);
    table.string('photo_url', 500);
    table.decimal('hr_min', 5, 0).defaultTo(50);
    table.decimal('hr_max', 5, 0).defaultTo(120);
    table.decimal('bp_sys_min', 5, 0).defaultTo(90);
    table.decimal('bp_sys_max', 5, 0).defaultTo(180);
    table.decimal('spo2_min', 5, 0).defaultTo(92);
    table.decimal('glucose_max', 6, 1).defaultTo(200);
  });

  await knex.schema.createTable('emergency_contacts', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('relationship', 100);
    table.string('phone', 20);
    table.string('email', 255);
    table.integer('priority').defaultTo(1);
  });

  await knex.schema.createTable('caretaker_profiles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('relationship_type', 100);
    table.string('shift_start', 10);
    table.string('shift_end', 10);
    table.string('certification', 255);
    table.integer('max_elders').defaultTo(5);
  });

  await knex.schema.createTable('doctor_profiles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    table.string('specialization', 255);
    table.string('hospital_affiliation', 255);
    table.string('license_number', 100);
    table.string('consultation_hours', 255);
    table.text('digital_signature');
  });

  await knex.schema.createTable('user_preferences', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
    table.boolean('email_notifications').defaultTo(true);
    table.boolean('sms_notifications').defaultTo(true);
    table.boolean('push_notifications').defaultTo(true);
    table.boolean('whatsapp_notifications').defaultTo(false);
    table.string('notification_language', 10).defaultTo('en');
    table.integer('data_retention_days').defaultTo(365);
  });

  await knex.schema.createTable('family_access', (table) => {
    table.increments('id').primary();
    table.integer('family_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.string('relationship', 100);
    table.unique(['family_user_id', 'elder_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('family_access');
  await knex.schema.dropTableIfExists('user_preferences');
  await knex.schema.dropTableIfExists('doctor_profiles');
  await knex.schema.dropTableIfExists('caretaker_profiles');
  await knex.schema.dropTableIfExists('emergency_contacts');
};
