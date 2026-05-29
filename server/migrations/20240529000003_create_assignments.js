exports.up = function (knex) {
  return knex.schema
    .createTable('caretaker_elders', (table) => {
      table.increments('id').primary();
      table.integer('caretaker_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.unique(['caretaker_id', 'elder_id']);
    })
    .createTable('doctor_elders', (table) => {
      table.increments('id').primary();
      table.integer('doctor_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('elder_id').unsigned().notNullable().references('id').inTable('elders').onDelete('CASCADE');
      table.unique(['doctor_id', 'elder_id']);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('doctor_elders').dropTableIfExists('caretaker_elders');
};
