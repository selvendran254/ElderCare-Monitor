exports.up = function (knex) {
  return knex.schema
    .createTable('medications', (table) => {
      table.increments('id').primary();
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('dosage', 100);
      table.string('frequency', 100).notNullable();
      table.time('scheduled_time').defaultTo('08:00:00');
      table.date('start_date').notNullable();
      table.date('end_date');
    })
    .createTable('medication_logs', (table) => {
      table.increments('id').primary();
      table.integer('medication_id').unsigned().notNullable().references('id').inTable('medications').onDelete('CASCADE');
      table.timestamp('taken_at').defaultTo(knex.fn.now());
      table.enum('status', ['taken', 'missed']).notNullable();
      table.date('log_date');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('medication_logs').dropTableIfExists('medications');
};
