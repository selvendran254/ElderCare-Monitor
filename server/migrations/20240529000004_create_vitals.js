exports.up = function (knex) {
  return knex.schema.createTable('vitals', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.integer('heart_rate');
    table.integer('blood_pressure_sys');
    table.integer('blood_pressure_dia');
    table.timestamp('recorded_at').defaultTo(knex.fn.now());
    table.index(['elder_id', 'recorded_at']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('vitals');
};
