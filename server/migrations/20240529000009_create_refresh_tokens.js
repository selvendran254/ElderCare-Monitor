exports.up = function (knex) {
  return knex.schema
    .createTable('refresh_tokens', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('token', 512).notNullable().unique();
      table.timestamp('expires_at').notNullable();
    })
    .createTable('push_subscriptions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.jsonb('subscription').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('push_subscriptions').dropTableIfExists('refresh_tokens');
};
