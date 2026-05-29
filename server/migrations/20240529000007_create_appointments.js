exports.up = function (knex) {
  return knex.schema.createTable('appointments', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.integer('doctor_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('scheduled_at').notNullable();
    table.text('notes');
    table.text('clinical_notes');
    table.enum('status', ['pending', 'approved', 'rescheduled', 'completed', 'cancelled']).defaultTo('pending');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('appointments');
};
