import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const isSQLite = knex.client.config.client === 'better-sqlite3';

  await knex.schema
    .createTable('classes', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('level').defaultTo('');
      table.text('description').defaultTo('');
      if (isSQLite) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      } else {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      }
    })
    .createTable('students', (table) => {
      table.increments('id').primary();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('email').defaultTo('');
      table.integer('class_id').references('id').inTable('classes').onDelete('SET NULL');
      if (isSQLite) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      } else {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      }
    })
    .createTable('exercises', (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('subject').defaultTo('');
      table.text('description').defaultTo('');
      table.integer('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.string('due_date').defaultTo('');
      if (isSQLite) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      } else {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      }
    })
    .createTable('evaluation_criteria', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description').defaultTo('');
      table.float('max_score').defaultTo(10);
      table.float('weight').defaultTo(1.0);
    })
    .createTable('submissions', (table) => {
      table.increments('id').primary();
      table.integer('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
      table.integer('student_id').references('id').inTable('students').onDelete('CASCADE');
      table.text('content').defaultTo('');
      if (isSQLite) {
        table.timestamp('submitted_at').defaultTo(knex.fn.now());
      } else {
        table.timestamp('submitted_at').defaultTo(knex.fn.now());
      }
    })
    .createTable('grades', (table) => {
      table.increments('id').primary();
      table.integer('submission_id').references('id').inTable('submissions').onDelete('CASCADE');
      table.integer('criterion_id').references('id').inTable('evaluation_criteria').onDelete('CASCADE');
      table.float('score').defaultTo(0);
      table.text('comment').defaultTo('');
      if (isSQLite) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      } else {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      }
    })
    .createTable('ai_feedback', (table) => {
      table.increments('id').primary();
      table.integer('submission_id').references('id').inTable('submissions').onDelete('CASCADE');
      table.text('feedback').defaultTo('');
      if (isSQLite) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      } else {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      }
    })
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username').notNullable().unique();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('full_name').notNullable();
      table.string('role').defaultTo('teacher');
      if (isSQLite) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      } else {
        table.timestamp('created_at').defaultTo(knex.fn.now());
      }
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTableIfExists('ai_feedback')
    .dropTableIfExists('grades')
    .dropTableIfExists('submissions')
    .dropTableIfExists('evaluation_criteria')
    .dropTableIfExists('exercises')
    .dropTableIfExists('students')
    .dropTableIfExists('classes')
    .dropTableIfExists('users');
}
