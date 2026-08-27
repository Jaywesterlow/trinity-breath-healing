/**
 * The one Postgres connection, lazily opened.
 *
 * Lazy on purpose, same reasoning as $env/dynamic/private everywhere else in
 * this codebase: the landing page is prerendered at build time, and a module
 * that connects on import would need a live database during `vite build`.
 * Nothing here runs until a request actually asks for a slot.
 *
 * `prepare: false` is required, not stylistic. Supabase's pooled connection
 * string (port 6543) runs PgBouncer in transaction mode, where a prepared
 * statement created on one connection is not there on the next one — queries
 * fail intermittently under load, which is the worst way to find out.
 */
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

let client: postgres.Sql | null = null;

export function isDatabaseConfigured(): boolean {
	return Boolean(env.DATABASE_URL);
}

export function db(): postgres.Sql {
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set — the booking store cannot be reached.');
	}
	client ??= postgres(env.DATABASE_URL, {
		prepare: false,
		/* Supabase refuses unencrypted connections, and postgres.js does NOT
		   enable TLS on its own — its default is ssl: false. The connection
		   string Supabase hands you carries no sslmode either, so without this
		   every query fails to connect. 'require' rather than 'prefer': a
		   silent downgrade to plaintext is not an acceptable fallback for a
		   production database, even one holding only dates and times. */
		ssl: 'require',
		/* Serverless: many short-lived instances, each wanting very little. A
		   large pool per instance is how a small site exhausts its connection
		   limit without ever being busy. */
		max: 1,
		idle_timeout: 20,
		connect_timeout: 10
	});
	return client;
}
