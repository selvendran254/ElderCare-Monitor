exports.up = function (knex) {
  return knex.schema.createTable('elders', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('age');
    table.string('blood_group', 10);
    table.string('emergency_contact', 255);
    table.text('address');
    table.unique(['user_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('elders');
};
