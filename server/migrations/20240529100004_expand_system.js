exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_type_check;
    ALTER TABLE alerts ALTER COLUMN type TYPE varchar(50);
  `);

  await knex.schema.createTable('alert_rules', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('metric', 100).notNullable();
    table.string('operator', 10).notNullable();
    table.decimal('threshold', 10, 2);
    table.string('alert_type', 50).notNullable();
    table.text('message_template');
    table.boolean('enabled').defaultTo(true);
    table.integer('elder_id').unsigned().references('id').inTable('elders').onDelete('CASCADE');
  });

  await knex.schema.createTable('iot_devices', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.string('device_type', 100).notNullable();
    table.string('device_name', 255);
    table.string('device_id', 255).unique();
    table.string('status', 50).defaultTo('active');
    table.integer('battery_level');
    table.timestamp('last_seen');
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);
    table.decimal('geofence_radius_m', 8, 2);
  });

  await knex.schema.createTable('iot_readings', (table) => {
    table.increments('id').primary();
    table.integer('device_id').unsigned().notNullable().references('id').inTable('iot_devices').onDelete('CASCADE');
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.string('reading_type', 100);
    table.jsonb('data').notNullable();
    table.timestamp('recorded_at').defaultTo(knex.fn.now());
    table.index(['elder_id', 'recorded_at']);
  });

  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('entity_type', 100);
    table.integer('entity_id');
    table.jsonb('details');
    table.string('ip_address', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['user_id', 'created_at']);
  });

  await knex.schema.createTable('health_scores', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.date('score_date').notNullable();
    table.integer('overall_score');
    table.integer('cardiac_risk');
    table.integer('fall_risk');
    table.integer('medication_risk');
    table.integer('activity_score');
    table.unique(['elder_id', 'score_date']);
  });

  await knex.schema.createTable('shift_handovers', (table) => {
    table.increments('id').primary();
    table.integer('caretaker_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('elder_id').unsigned().references('id').inTable('elders').onDelete('CASCADE');
    table.text('notes');
    table.jsonb('tasks_completed').defaultTo('[]');
    table.jsonb('tasks_pending').defaultTo('[]');
    table.timestamp('handover_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('shift_handovers');
  await knex.schema.dropTableIfExists('health_scores');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('iot_readings');
  await knex.schema.dropTableIfExists('iot_devices');
  await knex.schema.dropTableIfExists('alert_rules');
};
