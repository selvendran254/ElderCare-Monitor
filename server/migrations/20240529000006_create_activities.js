exports.up = function (knex) {
  return knex.schema.createTable('activities', (table) => {
    table.increments('id').primary();
    table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
    table.integer('steps').defaultTo(0);
    table.decimal('sleep_hours', 4, 1).defaultTo(0);
    table.integer('meal_count').defaultTo(0);
    table.date('date').notNullable();
    table.unique(['elder_id', 'date']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('activities');
};
