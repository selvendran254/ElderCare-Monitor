exports.up = function (knex) {
  return knex.schema.createTable('alerts', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.enum('type', ['emergency', 'warning', 'info', 'sos']).notNullable();
    table.text('message').notNullable();
    table.timestamp('triggered_at').defaultTo(knex.fn.now());
    table.boolean('resolved').defaultTo(false);
    table.index(['elder_id', 'resolved']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('alerts');
};
