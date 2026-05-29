exports.up = async function (knex) {
  await knex.schema
    .createTable('gps_locations', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.decimal('latitude', 10, 7).notNullable();
      table.decimal('longitude', 10, 7).notNullable();
      table.decimal('accuracy_m', 8, 2);
      table.string('source', 50).defaultTo('gps');
      table.timestamp('recorded_at').defaultTo(knex.fn.now());
      table.index(['elder_id', 'recorded_at']);
    })
    .createTable('fall_events', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.decimal('impact_force', 8, 2);
      table.jsonb('sensor_data');
      table.boolean('confirmed').defaultTo(false);
      table.timestamp('detected_at').defaultTo(knex.fn.now());
    })
    .createTable('voice_logs', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.text('transcript');
      table.string('language', 10);
      table.jsonb('parsed_data');
      table.timestamp('recorded_at').defaultTo(knex.fn.now());
    })
    .createTable('pill_boxes', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.string('device_id', 100).unique();
      table.string('name', 255);
      table.integer('compartments').defaultTo(4);
      table.integer('battery_level').defaultTo(100);
      table.string('status', 50).defaultTo('online');
      table.timestamp('last_sync');
    })
    .createTable('pill_box_events', (table) => {
      table.increments('id').primary();
      table.integer('pill_box_id').unsigned().notNullable().references('id').inTable('pill_boxes').onDelete('CASCADE');
      table.integer('compartment').notNullable();
      table.string('event_type', 50).notNullable();
      table.timestamp('event_at').defaultTo(knex.fn.now());
    })
    .createTable('blockchain_records', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.string('record_type', 100).notNullable();
      table.integer('record_id');
      table.text('data_hash').notNullable();
      table.text('prev_hash');
      table.text('block_hash').notNullable();
      table.integer('block_index').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['elder_id', 'block_index']);
    })
    .createTable('hospital_integrations', (table) => {
      table.increments('id').primary();
      table.string('hospital_code', 50).notNullable().unique();
      table.string('hospital_name', 255).notNullable();
      table.string('abdm_id', 100);
      table.string('api_endpoint', 500);
      table.string('status', 50).defaultTo('active');
      table.jsonb('config');
    })
    .createTable('hospital_sync_logs', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().references('id').inTable('elders').onDelete('CASCADE');
      table.integer('hospital_id').unsigned().references('id').inTable('hospital_integrations').onDelete('CASCADE');
      table.string('sync_type', 100);
      table.string('status', 50);
      table.jsonb('payload');
      table.timestamp('synced_at').defaultTo(knex.fn.now());
    })
    .createTable('ai_predictions', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.date('prediction_date').notNullable();
      table.integer('risk_score');
      table.string('risk_level', 20);
      table.text('summary');
      table.jsonb('daily_forecast');
      table.unique(['elder_id', 'prediction_date']);
    })
    .createTable('video_sessions', (table) => {
      table.increments('id').primary();
      table.integer('appointment_id').unsigned().references('id').inTable('appointments').onDelete('SET NULL');
      table.integer('elder_id').unsigned().references('id').inTable('elders').onDelete('CASCADE');
      table.integer('doctor_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('room_id', 100).notNullable();
      table.string('room_url', 500);
      table.string('status', 50).defaultTo('scheduled');
      table.timestamp('started_at');
      table.timestamp('ended_at');
    });

  await knex('hospital_integrations').insert([
    { hospital_code: 'TN-GOV-GH001', hospital_name: 'Government General Hospital, Chennai', abdm_id: 'ABDM-TN-001', api_endpoint: 'https://api.abdm.gov.in/mock/v1', status: 'active' },
    { hospital_code: 'TN-GOV-GH002', hospital_name: 'Rajiv Gandhi Govt Hospital', abdm_id: 'ABDM-TN-002', api_endpoint: 'https://api.abdm.gov.in/mock/v1', status: 'active' },
    { hospital_code: 'TN-GOV-PHC003', hospital_name: 'Primary Health Centre, Tambaram', abdm_id: 'ABDM-TN-003', api_endpoint: 'https://api.abdm.gov.in/mock/v1', status: 'active' },
  ]);
};

exports.down = async function (knex) {
  await knex.schema
    .dropTableIfExists('video_sessions')
    .dropTableIfExists('ai_predictions')
    .dropTableIfExists('hospital_sync_logs')
    .dropTableIfExists('hospital_integrations')
    .dropTableIfExists('blockchain_records')
    .dropTableIfExists('pill_box_events')
    .dropTableIfExists('pill_boxes')
    .dropTableIfExists('voice_logs')
    .dropTableIfExists('fall_events')
    .dropTableIfExists('gps_locations');
};
